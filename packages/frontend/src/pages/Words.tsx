import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWordBooks } from "../api/wordBooks";
import { useWordBook } from "../store/WordBookContext";
import {
  Card,
  Input,
  Tag,
  Typography,
  Spin,
  Empty,
  Row,
  Col,
  Button,
  Space,
} from "../components/antd-wrapper";

const { Title, Text, Paragraph } = Typography;

const LEVELS = [
  { key: "", label: "全部" },
  { key: "primary", label: "小学" },
  { key: "junior", label: "初中" },
  { key: "senior", label: "高中" },
  { key: "college", label: "大学" },
];

const LEVEL_COLORS: Record<string, string> = {
  primary: "green",
  junior: "blue",
  senior: "orange",
  college: "purple",
};

function Words() {
  const [activeLevel, setActiveLevel] = useState("");
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const { state, selectBook } = useWordBook();

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["wordBooks", activeLevel],
    queryFn: () => getWordBooks(activeLevel || undefined),
  });

  const filteredBooks = useMemo(() => {
    if (!searchText.trim()) return books;
    const lower = searchText.trim().toLowerCase();
    return books.filter(
      (b) => b.name.toLowerCase().includes(lower) || b.description.toLowerCase().includes(lower),
    );
  }, [books, searchText]);

  const handleSelect = (book: (typeof books)[0]) => {
    selectBook(book);
    navigate(`/words/learn/${book.id}`);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Title level={3}>词书市场</Title>

      {/* 搜索 + 筛选 */}
      <Space direction="vertical" size="middle" style={{ width: "100%", marginBottom: 24 }}>
        <Input.Search
          placeholder="搜索词书名称或描述..."
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 400 }}
        />

        <Space wrap>
          {LEVELS.map((l) => (
            <Tag
              key={l.key}
              color={activeLevel === l.key ? "#764ba2" : undefined}
              style={{
                cursor: "pointer",
                padding: "4px 12px",
                fontSize: 14,
              }}
              onClick={() => setActiveLevel(l.key)}
            >
              {l.label}
            </Tag>
          ))}
        </Space>
      </Space>

      {/* 词书列表 */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <Empty description="暂无词书" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredBooks.map((book) => {
            const isSelected = state.selectedBook?.id === book.id;
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={book.id}>
                <Card
                  hoverable
                  style={{
                    height: "100%",
                    borderColor: isSelected ? "#764ba2" : undefined,
                    borderWidth: isSelected ? 2 : 1,
                  }}
                  actions={[
                    <Button
                      key="action"
                      type={isSelected ? "default" : "primary"}
                      block
                      style={
                        isSelected
                          ? { color: "#764ba2", borderColor: "#764ba2" }
                          : { background: "#764ba2", borderColor: "#764ba2" }
                      }
                      onClick={() => handleSelect(book)}
                    >
                      {isSelected ? "继续学习" : "选择学习"}
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space>
                        <span>{book.name}</span>
                        {isSelected && (
                          <Tag color="#764ba2" style={{ margin: 0 }}>
                            当前学习
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <>
                        <div style={{ marginBottom: 8 }}>
                          <Tag color={LEVEL_COLORS[book.level] || "default"}>
                            {LEVELS.find((l) => l.key === book.level)?.label || book.level}
                          </Tag>
                          <Text type="secondary">{book.word_count} 个单词</Text>
                        </div>
                        <Paragraph
                          type="secondary"
                          ellipsis={{ rows: 2 }}
                          style={{ marginBottom: 0, fontSize: 13 }}
                        >
                          {book.description}
                        </Paragraph>
                      </>
                    }
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}

export default Words;
