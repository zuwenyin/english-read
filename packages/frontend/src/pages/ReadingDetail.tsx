import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Typography, Tag, Spin, Button, Radio, message, Card } from "../components/antd-wrapper";
import { getArticleById, submitArticleProgress } from "../api/articles";
import { speak, isSpeechSupported } from "../utils/speech";
import type { Question } from "../types";

const { Title, Paragraph } = Typography;

/** 清洗选项文本中的字母前缀（兼容 AI 偶尔输出 "A. xxx" 的格式） */
function stripOptionPrefix(opt: string): string {
  return opt.replace(/^[A-D][.．、)）]\s*/i, "").trim();
}

const LEVEL_LABELS: Record<string, string> = {
  primary: "小学",
  junior: "初中",
  senior: "高中",
  college: "大学",
};

const CATEGORY_LABELS: Record<string, string> = {
  story: "故事",
  news: "新闻",
};

// 生词高亮全局样式（注入一次）
const VOCAB_STYLE_ID = "vocabulary-highlight-style";
if (!document.getElementById(VOCAB_STYLE_ID)) {
  const style = document.createElement("style");
  style.id = VOCAB_STYLE_ID;
  style.textContent = `
    .article-content mark.vocabulary {
      background: transparent;
      color: #1677ff;
      border-bottom: 2px dashed #1677ff;
      cursor: pointer;
      padding: 0 1px;
      transition: background 0.2s;
    }
    .article-content mark.vocabulary:hover {
      background: #e6f4ff;
    }
    .article-content mark.vocabulary.user-unfamiliar {
      color: #fa8c16;
      border-bottom: 2px dashed #fa8c16;
    }
    .article-content mark.vocabulary.user-unfamiliar:hover {
      background: #fff7e6;
    }
    @media (max-width: 575px) {
      .article-content { font-size: 15px; line-height: 1.7; }
    }
  `;
  document.head.appendChild(style);
}

function ArticleRead() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const articleId = Number(id);

  // 当前查词状态
  const [lookupWord, setLookupWord] = useState<{
    word: string;
    translation: string;
    phonetic?: string;
  } | null>(null);
  const [popupPosition, setPopupPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // 答题状态
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const contentRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const clickedMarkRef = useRef<HTMLElement | null>(null);

  // 获取文章详情
  const { data: article, isLoading } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => getArticleById(articleId),
    enabled: !!articleId,
  });

  // 构建生词映射表：word → { translation, phonetic }
  const wordMap = useMemo(() => {
    if (!article?.article_words) return new Map();
    const map = new Map<string, { translation: string; phonetic?: string }>();
    article.article_words.forEach((aw) => {
      map.set(aw.word.toLowerCase(), {
        translation: aw.translation,
        phonetic: aw.phonetic,
      });
    });
    return map;
  }, [article]);

  // DeepSeek 标注的生词集合（蓝色高亮），所有用户可见
  const articleVocabWords = useMemo(() => {
    return new Set(wordMap.keys());
  }, [wordMap]);

  // 用户不熟悉单词集合（familiarity ≤ 2），叠加橙色高亮
  const unfamiliarWords = useMemo(() => {
    if (!article?.user_word_familiarity) return new Set<string>();
    const set = new Set<string>();
    Object.entries(article.user_word_familiarity).forEach(([word, fam]) => {
      if (fam > 0 && fam <= 2) set.add(word.toLowerCase());
    });
    return set;
  }, [article]);

  // DOM 动态标注生词（蓝色）和用户不熟词（橙色叠加）
  useEffect(() => {
    const hasArticleVocab = articleVocabWords.size > 0;
    const hasUnfamiliar = unfamiliarWords.size > 0;
    if (!contentRef.current || (!hasArticleVocab && !hasUnfamiliar)) return;

    const container = contentRef.current;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (
          parent?.tagName === "MARK" ||
          parent?.tagName === "SCRIPT" ||
          parent?.tagName === "STYLE"
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const replacements: Array<{ node: Text; fragment: DocumentFragment }> = [];
    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      const text = textNode.textContent || "";
      const regex = /\b[a-zA-Z]{2,}\b/g;
      let match: RegExpExecArray | null;
      let lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let hasMatch = false;

      while ((match = regex.exec(text)) !== null) {
        const word = match[0].toLowerCase();
        // 蓝色生词高亮：检查 articleVocabWords
        // 橙色叠加：如果同时在不熟词集合中，用 user-unfamiliar 样式
        const isUnfamiliar = hasUnfamiliar && unfamiliarWords.has(word);
        const shouldHighlight = (hasArticleVocab && articleVocabWords.has(word)) || isUnfamiliar;

        if (shouldHighlight) {
          hasMatch = true;
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          }
          const mark = document.createElement("mark");
          mark.className = isUnfamiliar ? "vocabulary user-unfamiliar" : "vocabulary";
          mark.setAttribute("data-word", match[0]);
          mark.textContent = match[0];
          fragment.appendChild(mark);
          lastIndex = regex.lastIndex;
        }
      }

      if (hasMatch) {
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        replacements.push({ node: textNode, fragment });
      }
    }

    replacements.forEach(({ node, fragment }) => {
      node.parentNode?.replaceChild(fragment, node);
    });
  }, [article?.id, articleVocabWords, unfamiliarWords]);

  // 关闭弹窗
  const closePopup = useCallback(() => {
    setPopupPosition(null);
    setLookupWord(null);
    clickedMarkRef.current = null;
  }, []);

  // 计算弹窗位置（基于被点击 mark 元素的 viewport 坐标）
  const calcPopupPosition = useCallback((markEl: HTMLElement, popupW: number, popupH: number) => {
    const rect = markEl.getBoundingClientRect();
    const gap = 4;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // 默认定位：单词正下方，水平居中
    let top = rect.bottom + gap;
    let left = rect.left + rect.width / 2 - popupW / 2;

    // 水平边界处理
    if (left < 8) left = 8;
    if (left + popupW > viewportW - 8) left = viewportW - popupW - 8;

    // 垂直方向：下方空间不足则翻转到上方
    if (top + popupH > viewportH - 8) {
      top = rect.top - popupH - gap;
      if (top < 8) top = 8; // 上方也不足则固定在顶部
    }

    return { top, left };
  }, []);

  // 点击文章内容区域 → 通过事件委托处理生词点击
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "MARK" && target.classList.contains("vocabulary")) {
        e.stopPropagation();
        const word = target.getAttribute("data-word") || target.textContent || "";

        // 点击同一个单词 → 关闭弹窗（toggle）
        if (clickedMarkRef.current === target && popupPosition) {
          closePopup();
          return;
        }

        const info = wordMap.get(word.toLowerCase());
        if (info) {
          setLookupWord({ word, ...info });
        } else {
          setLookupWord({ word, translation: "需要加强记忆" });
        }

        clickedMarkRef.current = target;
        // 先用一个近似尺寸计算位置（弹窗首次渲染后会在 effect 中微调）
        const pos = calcPopupPosition(target, 240, 120);
        setPopupPosition(pos);
      }
    },
    [wordMap, popupPosition, closePopup, calcPopupPosition],
  );

  // 弹窗渲染后根据实际尺寸微调位置
  useEffect(() => {
    if (popupRef.current && popupPosition && clickedMarkRef.current) {
      const popupRect = popupRef.current.getBoundingClientRect();
      const pos = calcPopupPosition(clickedMarkRef.current, popupRect.width, popupRect.height);
      // 仅在位置有显著变化时更新，避免循环
      if (
        Math.abs(pos.top - popupPosition.top) > 1 ||
        Math.abs(pos.left - popupPosition.left) > 1
      ) {
        setPopupPosition(pos);
      }
    }
  }, [lookupWord, popupPosition, calcPopupPosition]);

  // 滚动时关闭弹窗
  useEffect(() => {
    if (!popupPosition) return;
    const handleScroll = () => closePopup();
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [popupPosition, closePopup]);

  // 点击弹窗外关闭
  useEffect(() => {
    if (!popupPosition) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        clickedMarkRef.current &&
        !clickedMarkRef.current.contains(e.target as Node)
      ) {
        closePopup();
      }
    };
    // 延迟绑定，避免本次点击事件冒泡直接触发关闭
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [popupPosition, closePopup]);

  // 发音
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  const handleSpeak = async (word: string) => {
    if (!isSpeechSupported()) {
      message.info("您的浏览器不支持语音播放");
      return;
    }
    setSpeakingWord(word);
    try {
      await speak(word);
    } catch {
      message.info("发音功能暂时不可用");
    } finally {
      setSpeakingWord(null);
    }
  };

  // 选择答案
  const handleAnswerSelect = (questionId: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  // 提交答题
  const submitMutation = useMutation({
    mutationFn: () => {
      if (!article) throw new Error("文章数据未加载");
      const answers = article.questions.map((q) => ({
        question_id: q.id,
        selected: selectedAnswers[q.id] || "",
      }));
      return submitArticleProgress(articleId, answers);
    },
    onSuccess: () => {
      message.success("提交成功！");
      navigate(`/reading/${articleId}/result`, { replace: true });
    },
    onError: (err: Error) => {
      message.error(err.message || "提交失败");
    },
  });

  // 已完成的用户自动跳转到结果页（?retry=1 时跳过）
  const [searchParams] = useSearchParams();
  const isRetry = searchParams.get("retry") === "1";
  useEffect(() => {
    if (!isRetry && article?.user_progress) {
      navigate(`/reading/${articleId}/result`, { replace: true });
    }
  }, [isRetry, article?.user_progress, articleId, navigate]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Title level={4}>文章不存在</Title>
      </div>
    );
  }

  const questions = article.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((q) => selectedAnswers[q.id]);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", paddingBottom: 80 }}>
      {/* 文章标题 + 元信息 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <Tag color="blue">{LEVEL_LABELS[article.level] || article.level}</Tag>
          <Tag>{CATEGORY_LABELS[article.category] || article.category}</Tag>
        </div>
        <Title level={3} style={{ marginTop: 0 }}>
          {article.title}
        </Title>
      </div>

      {/* 文章内容 */}
      <Card
        style={{ marginBottom: 24 }}
        styles={{ body: { padding: 24, lineHeight: 1.8, fontSize: 16 } }}
      >
        <div
          ref={contentRef}
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
          onClick={handleContentClick}
        />
      </Card>

      {/* 生词查词浮动弹窗 */}
      {popupPosition && lookupWord && (
        <div
          ref={popupRef}
          style={{
            position: "fixed",
            top: popupPosition.top,
            left: popupPosition.left,
            zIndex: 1050,
            minWidth: 180,
            maxWidth: 240,
            padding: "12px 16px",
            background: "#fff",
            borderRadius: 8,
            boxShadow:
              "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>{lookupWord.word}</div>
          {lookupWord.phonetic && (
            <div style={{ color: "#8c8c8c", marginBottom: 4, fontSize: 13 }}>
              {lookupWord.phonetic}
            </div>
          )}
          <div style={{ marginBottom: 8, fontSize: 14, color: "#333" }}>
            {lookupWord.translation}
          </div>
          <Button
            size="small"
            loading={speakingWord === lookupWord.word}
            onClick={() => handleSpeak(lookupWord.word)}
            icon={speakingWord !== lookupWord.word ? <>🔊</> : undefined}
          >
            {speakingWord === lookupWord.word ? "播放中..." : "发音"}
          </Button>
        </div>
      )}

      {/* 阅读理解题 */}
      {questions.length > 0 && (
        <Card title="阅读理解">
          {questions.map((q: Question, idx: number) => {
            const selected = selectedAnswers[q.id];
            return (
              <div key={q.id} style={{ marginBottom: 20 }}>
                <Paragraph strong>
                  {idx + 1}. {q.question}
                </Paragraph>
                <Radio.Group
                  value={selected}
                  onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {q.options.map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      const cleanOpt = stripOptionPrefix(opt);
                      return (
                        <Radio key={letter} value={letter}>
                          {letter}. {cleanOpt}
                        </Radio>
                      );
                    })}
                  </div>
                </Radio.Group>
              </div>
            );
          })}

          <Button
            type="primary"
            size="large"
            block
            disabled={!allAnswered || submitMutation.isPending}
            loading={submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {allAnswered ? "提交答案" : `请回答全部 ${questions.length} 题`}
          </Button>
        </Card>
      )}
    </div>
  );
}

export default ArticleRead;
