import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import {
  Card,
  Typography,
  Spin,
  Empty,
  Row,
  Col,
  Statistic,
  Button,
  Divider,
  Tag,
} from "../components/antd-wrapper";
import { getStatsOverview } from "../api/stats";
import { getWordBooks } from "../api/wordBooks";
import { getArticles } from "../api/articles";
import type { WordBookRecord, ArticleListItem } from "../types";

const { Title, Paragraph, Text } = Typography;

const LEVELS = [
  { key: "primary", label: "小学", icon: "📘", color: "#1890ff" },
  { key: "junior", label: "初中", icon: "📗", color: "#52c41a" },
  { key: "senior", label: "高中", icon: "📕", color: "#fa541c" },
  { key: "college", label: "大学", icon: "📙", color: "#722ed1" },
] as const;

// ============ 年级选择卡片 ============
function LevelSelection({ onSelect }: { onSelect: (level: string) => void }) {
  return (
    <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 24px", textAlign: "center" }}>
      <Title level={2} style={{ marginBottom: 8 }}>
        欢迎来到 English Read 📚
      </Title>
      <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 40 }}>
        科学的英语学习平台，从单词到阅读，一步步提升你的英语能力
      </Paragraph>
      <Row gutter={[24, 24]}>
        {LEVELS.map((level) => (
          <Col xs={24} sm={6} key={level.key}>
            <Card
              hoverable
              onClick={() => onSelect(level.key)}
              style={{
                borderRadius: 12,
                borderTop: `3px solid ${level.color}`,
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              bodyStyle={{ padding: "32px 16px", textAlign: "center" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>{level.icon}</div>
              <Title level={4} style={{ margin: 0 }}>
                {level.label}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

// ============ 已选年级 · 学习概览 ============
function HomeOverview({
  level,
  isAuthenticated,
  onResetLevel,
}: {
  level: string;
  isAuthenticated: boolean;
  onResetLevel: () => void;
}) {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: getStatsOverview,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ["wordBooks", level],
    queryFn: () => getWordBooks(level),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ["articles", "home", level],
    queryFn: () => getArticles({ level, pageSize: 6 }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const levelLabel = LEVELS.find((l) => l.key === level)?.label ?? level;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          {levelLabel} · 学习概览
        </Title>
        <Button onClick={onResetLevel}>切换年级</Button>
      </div>

      {/* Stats */}
      {statsLoading && <Spin style={{ display: "block", margin: "40px auto" }} />}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          <Col xs={8}>
            <Card>
              <Statistic title="已学单词" value={stats.total_words_learned} suffix="个" />
            </Card>
          </Col>
          <Col xs={8}>
            <Card>
              <Statistic title="已读文章" value={stats.total_articles_read} suffix="篇" />
            </Card>
          </Col>
          <Col xs={8}>
            <Card>
              <Statistic title="本周学习" value={stats.weekly_study_minutes} suffix="分钟" />
            </Card>
          </Col>
        </Row>
      )}

      {/* Recommended WordBooks */}
      <Divider orientation="left">推荐词书</Divider>
      {booksLoading && <Spin style={{ display: "block", margin: "20px auto" }} />}
      {books && books.length > 0 ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          {books.slice(0, 4).map((book: WordBookRecord) => (
            <Col xs={24} sm={12} key={book.id}>
              <Card hoverable onClick={() => navigate(`/words/learn/${book.id}`)}>
                <Text strong ellipsis style={{ display: "block" }}>
                  {book.name}
                </Text>
                <Text type="secondary">
                  {book.description} · {book.word_count} 词
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="暂无推荐词书" style={{ marginBottom: 32 }} />
      )}

      {/* Recommended Articles */}
      <Divider orientation="left">推荐文章</Divider>
      {articlesLoading && <Spin style={{ display: "block", margin: "20px auto" }} />}
      {articles && articles.list.length > 0 ? (
        <Row gutter={[16, 16]}>
          {articles.list.map((article: ArticleListItem) => (
            <Col xs={24} sm={12} md={8} key={article.id}>
              <Card hoverable onClick={() => navigate(`/reading/${article.id}`)}>
                <Text strong ellipsis style={{ display: "block", marginBottom: 8 }}>
                  {article.title}
                </Text>
                <Text type="secondary" ellipsis>
                  {article.summary}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Tag
                    color={
                      article.category === "story"
                        ? "blue"
                        : article.category === "news"
                          ? "orange"
                          : "default"
                    }
                  >
                    {article.category === "story"
                      ? "故事"
                      : article.category === "news"
                        ? "新闻"
                        : article.category}
                  </Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="暂无推荐文章" />
      )}
    </div>
  );
}

// ============ 主组件 ============
function Home() {
  const { isAuthenticated } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(() =>
    localStorage.getItem("selectedLevel"),
  );

  // 退出登录后重置年级选择（仅在从已登录→未登录时触发，避免初始渲染误清）
  const prevAuth = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuth.current && !isAuthenticated) {
      setSelectedLevel(null);
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  const handleLevelSelect = (level: string) => {
    localStorage.setItem("selectedLevel", level);
    setSelectedLevel(level);
  };

  const handleResetLevel = () => {
    localStorage.removeItem("selectedLevel");
    setSelectedLevel(null);
  };

  if (!selectedLevel) {
    return <LevelSelection onSelect={handleLevelSelect} />;
  }

  return (
    <HomeOverview
      level={selectedLevel}
      isAuthenticated={isAuthenticated}
      onResetLevel={handleResetLevel}
    />
  );
}

export default Home;
