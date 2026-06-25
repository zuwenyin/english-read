import { useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Typography,
  Tag,
  Spin,
  Button,
  Radio,
  Popover,
  message,
  Result,
  Card,
} from "../components/antd-wrapper";
import { getArticleById, submitArticleProgress } from "../api/articles";
import { speak, isSpeechSupported } from "../utils/speech";
import type { Question, AnswerRecord } from "../types";

const { Title, Paragraph } = Typography;

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
  const [popoverOpen, setPopoverOpen] = useState(false);

  // 答题状态
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    answers: AnswerRecord[];
  } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

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

  // 点击文章内容区域 → 通过事件委托处理生词点击
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "MARK" && target.classList.contains("vocabulary")) {
        const word = target.getAttribute("data-word") || target.textContent || "";
        const info = wordMap.get(word.toLowerCase());
        if (info) {
          setLookupWord({ word, ...info });
          setPopoverOpen(true);
        }
      }
    },
    [wordMap],
  );

  // 发音
  const handleSpeak = async (word: string) => {
    if (!isSpeechSupported()) {
      message.info("您的浏览器不支持语音播放");
      return;
    }
    try {
      await speak(word);
    } catch {
      message.info("发音功能暂时不可用");
    }
  };

  // 选择答案
  const handleAnswerSelect = (questionId: number, option: string) => {
    if (submitted) return;
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
    onSuccess: (_data, _variables) => {
      // 后端返回 { id, quiz_score, completed_at }
      // 本地构建 answers 记录用于展示解析
      const validated = article!.questions.map((q) => {
        const selected = selectedAnswers[q.id] || "";
        return {
          question_id: q.id,
          selected,
          correct: q.answer,
          is_correct: selected === q.answer,
        };
      });
      const correctCount = validated.filter((a) => a.is_correct).length;
      setQuizResult({
        score: Math.round((correctCount / validated.length) * 100),
        answers: validated,
      });
      setSubmitted(true);
      message.success("提交成功！");
    },
    onError: (err: Error) => {
      message.error(err.message || "提交失败");
    },
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!article) {
    return <Result status="404" title="文章不存在" subTitle="请检查链接是否正确" />;
  }

  // 已提交 → 显示答题结果
  if (submitted && quizResult) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", paddingBottom: 80 }}>
        <Title level={3}>答题结果</Title>
        <Card style={{ marginBottom: 24, textAlign: "center" }}>
          <Title level={2} style={{ color: quizResult.score >= 60 ? "#52c41a" : "#ff4d4f" }}>
            {quizResult.score} 分
          </Title>
          <Paragraph type="secondary">
            正确 {quizResult.answers.filter((a) => a.is_correct).length} /{" "}
            {quizResult.answers.length} 题
          </Paragraph>
        </Card>

        <Title level={4}>题目解析</Title>
        {article.questions.map((q: Question, idx: number) => {
          const record = quizResult.answers.find((a) => a.question_id === q.id);
          const isCorrect = record?.is_correct ?? false;
          return (
            <Card
              key={q.id}
              style={{ marginBottom: 16 }}
              title={`第 ${idx + 1} 题 ${isCorrect ? "✅" : "❌"}`}
            >
              <Paragraph strong>{q.question}</Paragraph>
              {q.options.map((opt, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx);
                let color = "";
                if (letter === q.answer) color = "#52c41a";
                if (!isCorrect && letter === record?.selected) color = "#ff4d4f";
                return (
                  <Paragraph key={letter} style={{ color: color || undefined }}>
                    {letter}. {opt}
                    {letter === q.answer ? " ← 正确答案" : ""}
                    {!isCorrect && letter === record?.selected ? " ← 你的选择" : ""}
                  </Paragraph>
                );
              })}
              <Paragraph type="secondary">解析：{q.explanation}</Paragraph>
            </Card>
          );
        })}

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate("/reading")}>
            返回阅读列表
          </Button>
        </div>
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

      {/* 生词查词 Popover */}
      <Popover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        content={
          lookupWord ? (
            <div style={{ maxWidth: 220 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{lookupWord.word}</div>
              {lookupWord.phonetic && (
                <div style={{ color: "#8c8c8c", marginBottom: 4 }}>{lookupWord.phonetic}</div>
              )}
              <div style={{ marginBottom: 8 }}>{lookupWord.translation}</div>
              <Button size="small" onClick={() => handleSpeak(lookupWord.word)} icon={<>🔊</>}>
                发音
              </Button>
            </div>
          ) : null
        }
        trigger="click"
        placement="bottom"
      >
        {/* Popover 不渲染 visible 子元素，通过 contentRef 上的 click 事件控制 */}
        <span />
      </Popover>

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
                      return (
                        <Radio key={letter} value={letter}>
                          {letter}. {opt}
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
