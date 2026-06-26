import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Typography, Tag, Spin, Button, Card } from "../components/antd-wrapper";
import { getArticleById } from "../api/articles";
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

/** 清洗选项文本中的字母前缀 */
function stripOptionPrefix(opt: string): string {
  return opt.replace(/^[A-D][.．、)）]\s*/i, "").trim();
}

function ReadingResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const articleId = Number(id);

  const [showTranslation, setShowTranslation] = useState(true);

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", articleId, "result"],
    queryFn: () => getArticleById(articleId),
    enabled: !!articleId,
  });

  // 解析段落翻译（兼容新旧两种格式）
  const translations = useMemo(() => {
    if (!article?.content_translation) return null;
    try {
      const parsed = JSON.parse(article.content_translation);
      if (!Array.isArray(parsed) || parsed.length === 0) return null;

      if (parsed[0]?.sentences) {
        return {
          format: "sentence" as const,
          paragraphs: parsed as { sentences: { en: string; zh: string }[] }[],
        };
      }
      if (parsed[0]?.text) {
        return {
          format: "paragraph" as const,
          paragraphs: parsed as { text: string; translation: string }[],
        };
      }
    } catch {
      // ignore
    }
    return null;
  }, [article]);

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
        <Button onClick={() => navigate("/reading")}>返回阅读列表</Button>
      </div>
    );
  }

  // 未提交用户直接访问结果页 → 重定向回阅读页
  if (!article.user_progress) {
    navigate(`/reading/${articleId}`, { replace: true });
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const { quiz_score, answers } = article.user_progress;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", paddingBottom: 80 }}>
      {/* 标题 + 元信息 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <Tag color="blue">{LEVEL_LABELS[article.level] || article.level}</Tag>
          <Tag>{CATEGORY_LABELS[article.category] || article.category}</Tag>
        </div>
        <Title level={3} style={{ marginTop: 0 }}>
          {article.title}
        </Title>
      </div>

      {/* 答题结果 */}
      <Title level={3}>答题结果</Title>
      <Card style={{ marginBottom: 24, textAlign: "center" }}>
        <Title level={2} style={{ color: quiz_score >= 60 ? "#52c41a" : "#ff4d4f" }}>
          {quiz_score} 分
        </Title>
        <Paragraph type="secondary">
          正确 {answers.filter((a) => a.is_correct).length} / {answers.length} 题
        </Paragraph>
      </Card>

      {/* 文章翻译 */}
      {translations && (
        <Card
          style={{ marginBottom: 24 }}
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>文章翻译</span>
              <Button
                type={showTranslation ? "primary" : "default"}
                size="small"
                onClick={() => setShowTranslation(!showTranslation)}
              >
                {showTranslation ? "隐藏中文" : "显示中文"}
              </Button>
            </div>
          }
        >
          {translations.format === "sentence" ? (
            <div style={{ lineHeight: 1.9, fontSize: 15 }}>
              {translations.paragraphs.map((para, pIdx) => (
                <div key={pIdx} style={{ marginBottom: 16 }}>
                  {para.sentences.map((s, sIdx) => (
                    <div key={sIdx} style={{ marginBottom: 6 }}>
                      <Paragraph
                        style={{
                          marginBottom: showTranslation ? 2 : 0,
                          fontWeight: 600,
                          color: "#1a1a1a",
                        }}
                      >
                        {s.en}
                      </Paragraph>
                      {showTranslation && (
                        <Paragraph
                          type="secondary"
                          style={{
                            marginBottom: 0,
                            paddingLeft: 12,
                            borderLeft: "3px solid #1677ff",
                            color: "#555",
                          }}
                        >
                          {s.zh}
                        </Paragraph>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ lineHeight: 2, fontSize: 15 }}>
                {translations.paragraphs.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: 16 }}>
                    <Paragraph
                      style={{
                        marginBottom: showTranslation ? 4 : 0,
                        color: "#1a1a1a",
                      }}
                    >
                      {item.text}
                    </Paragraph>
                    {showTranslation && (
                      <Paragraph
                        type="secondary"
                        style={{
                          marginBottom: 0,
                          paddingLeft: 12,
                          borderLeft: "3px solid #1677ff",
                          color: "#555",
                        }}
                      >
                        {item.translation}
                      </Paragraph>
                    )}
                  </div>
                ))}
              </div>
              <Paragraph type="secondary" style={{ marginTop: 12, fontSize: 13 }}>
                💡 翻译格式较旧，可在管理后台重新翻译为逐句对照格式。
              </Paragraph>
            </div>
          )}
        </Card>
      )}

      {/* 逐题解析 */}
      <Title level={4}>题目解析</Title>
      {article.questions.map((q: Question, idx: number) => {
        const record = answers.find((a: AnswerRecord) => a.question_id === q.id);
        const isCorrect = record?.is_correct ?? false;
        const correctAnswer = record?.correct ?? "";
        return (
          <Card
            key={q.id}
            style={{ marginBottom: 16 }}
            title={`第 ${idx + 1} 题 ${isCorrect ? "✅" : "❌"}`}
          >
            <Paragraph strong>{q.question}</Paragraph>
            {q.options.map((opt, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx);
              const cleanOpt = stripOptionPrefix(opt);
              let color = "";
              if (letter === correctAnswer) color = "#52c41a";
              if (!isCorrect && letter === record?.selected) color = "#ff4d4f";
              return (
                <Paragraph key={letter} style={{ color: color || undefined }}>
                  {letter}. {cleanOpt}
                  {letter === correctAnswer ? " ← 正确答案" : ""}
                  {!isCorrect && letter === record?.selected ? " ← 你的选择" : ""}
                </Paragraph>
              );
            })}
            <Paragraph type="secondary">解析：{record?.explanation ?? ""}</Paragraph>
          </Card>
        );
      })}

      <div
        style={{
          textAlign: "center",
          marginTop: 16,
          display: "flex",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <Button type="primary" onClick={() => navigate(`/reading/${articleId}?retry=1`)}>
          重新阅读
        </Button>
        <Button onClick={() => navigate("/reading")}>返回阅读列表</Button>
      </div>
    </div>
  );
}

export default ReadingResult;
