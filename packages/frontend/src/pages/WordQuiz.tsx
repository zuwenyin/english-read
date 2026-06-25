import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWordsByBook } from "../api/wordBooks";
import type { WordRecord } from "../types";
import {
  Card,
  Button,
  Typography,
  Progress,
  Spin,
  Empty,
  Space,
  Result,
  Statistic,
  Row,
  Col,
} from "../components/antd-wrapper";

const { Title, Text, Paragraph } = Typography;
const QUIZ_SIZE = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface QuizQuestion {
  word: WordRecord;
  options: string[];
  correctIndex: number;
}

function WordQuiz() {
  const { bookId } = useParams<{ bookId: string }>();
  const bookIdNum = Number(bookId);
  const navigate = useNavigate();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ question: QuizQuestion; selected: number }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 获取词书所有单词（分页取，这里简化为取100个）
  const { data: wordsData, isLoading } = useQuery({
    queryKey: ["quizWords", bookIdNum],
    queryFn: () => getWordsByBook(bookIdNum, 1, 200),
    enabled: !!bookIdNum,
  });

  const questions = useMemo(() => {
    if (!wordsData || wordsData.list.length < 4) return [];
    const wordPool = wordsData.list;
    const selected = shuffle(wordPool).slice(0, QUIZ_SIZE);

    return selected.map((word) => {
      // 从词书其他单词中取3个干扰翻译
      const others = wordPool.filter((w) => w.id !== word.id);
      const distractors = shuffle(others)
        .slice(0, 3)
        .map((w) => w.translation);
      const options = shuffle([word.translation, ...distractors]);
      const correctIndex = options.indexOf(word.translation);

      return { word, options, correctIndex };
    });
  }, [wordsData]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!wordsData || wordsData.list.length < 4) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="该词书单词不足，无法生成测试" />
      </div>
    );
  }

  // 结果页
  if (showResult) {
    const correctCount = answers.filter((a) => a.selected === a.question.correctIndex).length;
    const accuracy = Math.round((correctCount / answers.length) * 100);
    const wrongAnswers = answers.filter((a) => a.selected !== a.question.correctIndex);

    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 24, paddingBottom: 80 }}>
        <Result
          status={accuracy >= 60 ? "success" : "warning"}
          title="测试完成！"
          subTitle={`你答对了 ${correctCount} / ${answers.length} 题`}
        />

        <Row gutter={24} justify="center" style={{ marginBottom: 32 }}>
          <Col>
            <Statistic
              title="正确率"
              value={accuracy}
              suffix="%"
              valueStyle={{
                color: accuracy >= 60 ? "#52c41a" : "#ff4d4f",
              }}
            />
          </Col>
          <Col>
            <Statistic title="正确" value={correctCount} valueStyle={{ color: "#52c41a" }} />
          </Col>
          <Col>
            <Statistic title="错误" value={wrongAnswers.length} valueStyle={{ color: "#ff4d4f" }} />
          </Col>
        </Row>

        {wrongAnswers.length > 0 && (
          <Card title="错题回顾" style={{ marginBottom: 24 }}>
            {wrongAnswers.map((a, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 0",
                  borderBottom: i < wrongAnswers.length - 1 ? "1px solid #f0f0f0" : "none",
                }}
              >
                <Text strong style={{ fontSize: 16 }}>
                  {a.question.word.word}
                </Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {a.question.word.phonetic}
                </Text>
                <br />
                <Text type="danger">你的答案：{a.question.options[a.selected]}</Text>
                <br />
                <Text type="success">正确答案：{a.question.options[a.question.correctIndex]}</Text>
              </div>
            ))}
          </Card>
        )}

        <div style={{ textAlign: "center" }}>
          <Space>
            <Button onClick={() => navigate(`/words/learn/${bookId}`)}>返回学习</Button>
            <Button
              type="primary"
              onClick={() => {
                setCurrentIdx(0);
                setAnswers([]);
                setSelectedOption(null);
                setShowResult(false);
              }}
            >
              再测一次
            </Button>
          </Space>
        </div>
      </div>
    );
  }

  // 答题页
  const question = questions[currentIdx];
  const progress = Math.round(((currentIdx + 1) / questions.length) * 100);

  const handleSelect = (optionIdx: number) => {
    if (selectedOption !== null) return; // 已选，等待反馈
    setSelectedOption(optionIdx);
    setAnswers([...answers, { question, selected: optionIdx }]);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setShowResult(true);
    } else {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
    }
  };

  const isCorrect = selectedOption === question.correctIndex;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24, paddingBottom: 80 }}>
      {/* 进度条 */}
      <div style={{ marginBottom: 16 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text type="secondary">
            {currentIdx + 1} / {questions.length}
          </Text>
          <Text type="secondary">{progress}%</Text>
        </Space>
        <Progress percent={progress} showInfo={false} />
      </div>

      {/* 题目 */}
      <Card
        style={{
          textAlign: "center",
          borderColor: "#764ba2",
          borderWidth: 1,
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ marginBottom: 4 }}>
          {question.word.word}
        </Title>
        {question.word.phonetic && (
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            {question.word.phonetic}
          </Text>
        )}
        <Text style={{ fontSize: 16 }}>请选择正确的释义：</Text>
      </Card>

      {/* 选项 */}
      <Space direction="vertical" size="middle" style={{ width: "100%", marginBottom: 24 }}>
        {question.options.map((opt, i) => {
          let variant: "default" | "primary" | "dashed" = "default";
          let style: React.CSSProperties = {
            width: "100%",
            textAlign: "left",
            height: "auto",
            padding: "12px 16px",
          };

          if (selectedOption !== null) {
            if (i === question.correctIndex) {
              variant = "primary";
              style = { ...style, borderColor: "#52c41a", color: "#52c41a", background: "#f6ffed" };
            } else if (i === selectedOption && !isCorrect) {
              variant = "dashed";
              style = { ...style, borderColor: "#ff4d4f", color: "#ff4d4f", background: "#fff2f0" };
            }
          }

          return (
            <Button
              key={i}
              block
              variant={variant}
              color={variant === "primary" ? "green" : undefined}
              style={style}
              onClick={() => handleSelect(i)}
              disabled={selectedOption !== null}
            >
              <Space>
                <span
                  style={{
                    display: "inline-flex",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "1px solid #d9d9d9",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </Space>
            </Button>
          );
        })}
      </Space>

      {/* 反馈 + 下一题 */}
      {selectedOption !== null && (
        <div style={{ textAlign: "center" }}>
          <Paragraph
            style={{
              fontSize: 16,
              color: isCorrect ? "#52c41a" : "#ff4d4f",
              marginBottom: 16,
            }}
          >
            {isCorrect
              ? "✅ 回答正确！"
              : `❌ 回答错误！正确答案：${question.options[question.correctIndex]}`}
          </Paragraph>
          <Button type="primary" size="large" onClick={handleNext}>
            {currentIdx + 1 >= questions.length ? "查看结果" : "下一题 →"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default WordQuiz;
