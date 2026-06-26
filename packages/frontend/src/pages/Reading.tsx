import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Input,
  Select,
  Card,
  Typography,
  Tag,
  Pagination,
  Spin,
  Empty,
} from "../components/antd-wrapper";
import { getArticles } from "../api/articles";
import type { ArticleListItem } from "../types";

const { Title, Paragraph } = Typography;
const { Search } = Input;

const LEVEL_OPTIONS = [
  { value: "", label: "全部年级" },
  { value: "primary", label: "小学" },
  { value: "junior", label: "初中" },
  { value: "senior", label: "高中" },
  { value: "college", label: "大学" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "全部类型" },
  { value: "story", label: "故事" },
  { value: "news", label: "新闻" },
];

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

const LEVEL_TAG_COLORS: Record<string, string> = {
  primary: "blue",
  junior: "green",
  senior: "orange",
  college: "purple",
};

function ReadingList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [searchText, setSearchText] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // 防抖 timer（用 ref 避免闭包问题）
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data, isLoading } = useQuery({
    queryKey: ["articles", { keyword, level, category, page, pageSize }],
    queryFn: () =>
      getArticles({
        keyword: keyword || undefined,
        level: level || undefined,
        category: category || undefined,
        page,
        pageSize,
      }),
  });

  // 防抖搜索（500ms）：每次输入取消上一次 timer，重新计时
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setKeyword(value);
      setPage(1);
    }, 500);
  };

  // 直接搜索（按回车或点击搜索按钮）
  const handleSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setKeyword(value);
    setSearchText(value);
    setPage(1);
  };

  const handleLevelChange = (val: string) => {
    setLevel(val);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const list = data?.list ?? [];
  const total = data?.total ?? 0;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Title level={3}>阅读文章</Title>

      {/* 搜索 + 筛选栏 */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Search
          placeholder="搜索文章标题..."
          allowClear
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          onSearch={handleSearch}
          style={{ maxWidth: 320 }}
        />
        <Select
          value={level}
          onChange={handleLevelChange}
          options={LEVEL_OPTIONS}
          style={{ width: 120 }}
        />
        <Select
          value={category}
          onChange={handleCategoryChange}
          options={CATEGORY_OPTIONS}
          style={{ width: 120 }}
        />
      </div>

      {/* 文章卡片列表 */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : list.length === 0 ? (
        <Empty description="暂无文章" />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {list.map((article: ArticleListItem) => (
              <Card
                key={article.id}
                hoverable
                onClick={() => navigate(`/reading/${article.id}`)}
                style={{ cursor: "pointer", height: "100%" }}
              >
                <div
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Tag color={LEVEL_TAG_COLORS[article.level] || "default"}>
                    {LEVEL_LABELS[article.level] || article.level}
                  </Tag>
                  <Tag
                    color={
                      article.category === "story"
                        ? "blue"
                        : article.category === "news"
                          ? "orange"
                          : "default"
                    }
                  >
                    {CATEGORY_LABELS[article.category] || article.category}
                  </Tag>
                  {article.source && <Tag color="geekblue">{article.source}</Tag>}
                </div>
                <Card.Meta
                  title={article.title}
                  description={
                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0, color: "#8c8c8c" }}>
                      {article.summary || "暂无简介"}
                    </Paragraph>
                  }
                />
              </Card>
            ))}
          </div>

          {/* 分页 */}
          <Pagination
            current={page}
            total={total}
            pageSize={pageSize}
            onChange={handlePageChange}
            showSizeChanger={false}
            showTotal={(t) => `共 ${t} 篇文章`}
            style={{ textAlign: "center" }}
          />
        </>
      )}
    </div>
  );
}

export default ReadingList;
