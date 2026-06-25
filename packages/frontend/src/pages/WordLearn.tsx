import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWordsByBook } from "../api/wordBooks";
import { updateWordProgress, getWordProgress } from "../api/progress";
import { speak, isSpeechSupported } from "../utils/speech";
import {
  Card,
  Button,
  Typography,
  Progress,
  Spin,
  Empty,
  Space,
  FloatButton,
  message,
} from "../components/antd-wrapper";

const { Title, Text } = Typography;

const FAMILIARITY_OPTIONS = [
  { level: 1, label: "忘记", color: "#ff4d4f", emoji: "🔴" },
  { level: 2, label: "模糊", color: "#fa8c16", emoji: "🟠" },
  { level: 3, label: "一般", color: "#fadb14", emoji: "🟡" },
  { level: 4, label: "熟悉", color: "#1890ff", emoji: "🔵" },
  { level: 5, label: "精通", color: "#52c41a", emoji: "🟢" },
];

function WordLearn() {
  const { bookId } = useParams<{ bookId: string }>();
  const bookIdNum = Number(bookId);
  const [page, setPage] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const queryClient = useQueryClient();
  const speechSupported = isSpeechSupported();

  const { data: wordsData, isLoading } = useQuery({
    queryKey: ["words", bookIdNum, page],
    queryFn: () => getWordsByBook(bookIdNum, page, 20),
    enabled: !!bookIdNum,
  });

  const { data: progressList = [] } = useQuery({
    queryKey: ["wordProgress", bookIdNum],
    queryFn: () => getWordProgress(bookIdNum),
    enabled: !!bookIdNum,
  });

  const progressMut = useMutation({
    mutationFn: ({ wordId, familiarity }: { wordId: number; familiarity: number }) =>
      updateWordProgress(wordId, familiarity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wordProgress", bookIdNum] });
    },
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!wordsData || wordsData.list.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="该词书暂无单词" />
      </div>
    );
  }

  const { list, total } = wordsData;
  // 简单循环：每页20条，页数从1开始
  const totalPages = Math.ceil(total / 20);
  const currentWord = list[0] || list[0]; // 取当前页第一个单词
  const idx = (page - 1) * 20; // 当前单词在词书中的序号

  const progressMap = new Map(progressList.map((p) => [p.word_id, p]));
  const currentProgress = progressMap.get(currentWord.id);
  const learnedCount = progressList.length;

  const handleFamiliarity = (familiarity: number) => {
    progressMut.mutate({ wordId: currentWord.id, familiarity });
  };

  const handleSpeak = async () => {
    if (!speechSupported) {
      message.info(`音标: ${currentWord.phonetic || "无"}`);
      return;
    }
    setSpeaking(true);
    try {
      await speak(currentWord.word);
    } catch {
      message.info(`发音: ${currentWord.phonetic || "无"}`);
    } finally {
      setSpeaking(false);
    }
  };

  const goPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24, paddingBottom: 80 }}>
      {/* 进度条 */}
      <div style={{ marginBottom: 16 }}>
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 4 }}>
          <Text type="secondary">
            进度 {learnedCount} / {total}
          </Text>
          <Text type="secondary">
            {page} / {totalPages}
          </Text>
        </Space>
        <Progress percent={Math.round((learnedCount / total) * 100)} />
      </div>

      {/* 单词卡片 */}
      <Card
        style={{
          textAlign: "center",
          borderColor: "#764ba2",
          borderWidth: 1,
        }}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
          #{idx + 1}
        </Text>

        <Title level={2} style={{ marginBottom: 4 }}>
          {currentWord.word}
        </Title>

        <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 16 }}>
          {currentWord.phonetic || "/暂无音标/"}
        </Text>

        <Button
          type="default"
          shape="circle"
          size="large"
          loading={speaking}
          onClick={handleSpeak}
          style={{ marginBottom: 16 }}
        >
          {speechSupported ? "🔊" : "📖"}
        </Button>

        <Title level={4} style={{ color: "#764ba2", marginBottom: 8 }}>
          {currentWord.translation}
        </Title>

        {currentWord.example_sentence && (
          <Text italic style={{ display: "block", color: "#666", fontSize: 14, lineHeight: 1.6 }}>
            "{currentWord.example_sentence}"
          </Text>
        )}

        {currentProgress && (
          <Text type="secondary" style={{ display: "block", marginTop: 12, fontSize: 12 }}>
            已复习 {currentProgress.review_count} 次 · 熟识度:{" "}
            {FAMILIARITY_OPTIONS.find((f) => f.level === currentProgress.familiarity)?.emoji || "—"}
          </Text>
        )}
      </Card>

      {/* 熟识度按钮 */}
      <div style={{ marginTop: 16 }}>
        <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: 8 }}>
          你的熟识程度：
        </Text>
        <Space style={{ width: "100%", justifyContent: "center" }} wrap size={[8, 8]}>
          {FAMILIARITY_OPTIONS.map((opt) => (
            <Button
              key={opt.level}
              onClick={() => handleFamiliarity(opt.level)}
              loading={progressMut.isPending}
              style={{
                borderColor: opt.color,
                color: opt.color,
                minWidth: 72,
                minHeight: 44,
              }}
            >
              <div>{opt.emoji}</div>
              <div style={{ fontSize: 12 }}>{opt.label}</div>
            </Button>
          ))}
        </Space>
      </div>

      {/* 翻页 */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Button disabled={page <= 1} onClick={() => goPage(page - 1)} size="large">
          ← 上一个
        </Button>
        <Text type="secondary" style={{ lineHeight: "40px" }}>
          {page} / {totalPages}
        </Text>
        <Button disabled={page >= totalPages} onClick={() => goPage(page + 1)} size="large">
          下一个 →
        </Button>
      </div>

      {/* 去测试 */}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Button
          type="primary"
          size="large"
          style={{ background: "#764ba2", borderColor: "#764ba2" }}
          onClick={() => window.location.assign(`/words/quiz/${bookId}`)}
        >
          去测试 🧪
        </Button>
      </div>
    </div>
  );
}

export default WordLearn;
