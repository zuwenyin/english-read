import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Spin,
  Space,
  Typography,
  Tag,
  Table,
  message,
  Alert,
  Popconfirm,
  Modal,
  InputNumber,
  Form,
  Checkbox,
  Divider,
  Input,
} from "../components/antd-wrapper";
import {
  fetchArticles,
  getFetchStatus,
  deleteAllArticles,
  retranslateArticle,
  FetchResult,
} from "../api/admin";

const { Title, Text, Paragraph } = Typography;

const LEVELS = [
  { key: "primary", label: "小学" },
  { key: "junior", label: "初中" },
  { key: "senior", label: "高中" },
  { key: "college", label: "大学" },
] as const;

const ALL_SOURCES = [
  { key: "ChinaDaily", label: "China Daily（英文新闻）" },
  { key: "ProjectGutenberg", label: "Project Gutenberg（经典文学）" },
  { key: "BreakingNewsEnglish", label: "Breaking News English（ESL新闻）" },
] as const;

const DEFAULT_COUNT = 1;

function AdminPage() {
  const [isFetching, setIsFetching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastResult, setLastResult] = useState<FetchResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(LEVELS.map((l) => [l.key, DEFAULT_COUNT])),
  );
  const [sources, setSources] = useState<string[]>(["ChinaDaily"]);

  // 查询最近一次拉取状态（若正在拉取则自动轮询）
  const statusQuery = useQuery({
    queryKey: ["admin-fetch-status"],
    queryFn: getFetchStatus,
    refetchInterval: (query) =>
      (query.state.data as { fetching?: boolean })?.fetching ? 3000 : false,
    staleTime: 5000,
  });

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await deleteAllArticles();
      message.success(
        `已删除：${res.deleted.articles} 篇文章、${res.deleted.article_words} 个生词、${res.deleted.user_article_progress} 条阅读进度`,
      );
      setLastResult(null);
      statusQuery.refetch();
    } catch (err) {
      message.error(`删除失败：${(err as Error).message}`);
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, statusQuery]);

  const handleFetch = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);
    setModalOpen(false);
    try {
      const result = await fetchArticles(counts, sources);
      setLastResult(result);
      statusQuery.refetch();
      if (result.success) {
        message.success(
          `拉取完成：采集 ${result.fetched} 篇，入库 ${result.inserted} 篇，跳过 ${result.skipped} 篇，用时 ${(result.durationMs / 1000).toFixed(1)}s`,
        );
      } else {
        message.warning(`拉取完成但有错误：入库 ${result.inserted} 篇，失败 ${result.failed} 篇`);
      }
    } catch (err) {
      message.error(`拉取失败：${(err as Error).message}`);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, counts, sources, statusQuery]);

  // 重新翻译状态
  const [retranslateId, setRetranslateId] = useState<string>("");
  const [isRetranslating, setIsRetranslating] = useState(false);
  const [retranslateResult, setRetranslateResult] = useState<{
    success: boolean;
    message: string;
    preview?: { en: string; zh: string }[];
  } | null>(null);

  const handleRetranslate = useCallback(async () => {
    const id = Number(retranslateId);
    if (!id || id <= 0) {
      message.warning("请输入有效的文章 ID");
      return;
    }
    if (isRetranslating) return;
    setIsRetranslating(true);
    setRetranslateResult(null);
    try {
      const result = await retranslateArticle(id);
      setRetranslateResult(result);
      if (result.success) {
        message.success(result.message);
      } else {
        message.warning(result.message);
      }
    } catch (err) {
      setRetranslateResult({ success: false, message: `请求失败：${(err as Error).message}` });
      message.error(`翻译失败：${(err as Error).message}`);
    } finally {
      setIsRetranslating(false);
    }
  }, [retranslateId, isRetranslating]);

  const displayResult = lastResult || statusQuery.data;
  const isRunningFromServer =
    displayResult && (displayResult as unknown as { fetching?: boolean }).fetching;
  const isRunning = isFetching || isRunningFromServer;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      {/* 标题区 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>📋 管理后台 - 文章拉取</Title>
        <Paragraph type="secondary">
          从 China Daily 爬取真实英文文章，DeepSeek AI 自动生成问答和生词。定时任务每天早上 8:00
          自动执行。
        </Paragraph>
      </div>

      {/* 数量配置弹窗 */}
      <Modal
        title="配置拉取参数"
        open={modalOpen}
        onOk={handleFetch}
        onCancel={() => setModalOpen(false)}
        okText="开始拉取"
        cancelText="取消"
        okButtonProps={{ disabled: sources.length === 0 }}
      >
        {/* 数据源选择 */}
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            选择数据源（可多选）：
          </Text>
          <Checkbox.Group
            options={ALL_SOURCES.map((s) => ({ label: s.label, value: s.key }))}
            value={sources}
            onChange={(vals) => setSources(vals as string[])}
          />
        </div>

        <Divider style={{ margin: "12px 0" }} />

        {/* 年级数量 */}
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          设置每个年级要拉取的文章数量，设为 0 则跳过该年级。默认值可通过环境变量{" "}
          <code>ARTICLE_FETCH_COUNT</code> 配置。
        </Paragraph>
        <Form layout="inline" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {LEVELS.map((level) => (
            <Form.Item key={level.key} label={level.label} style={{ marginBottom: 0 }}>
              <InputNumber
                min={0}
                max={50}
                value={counts[level.key]}
                onChange={(val) => setCounts((prev) => ({ ...prev, [level.key]: val ?? 0 }))}
                style={{ width: 120 }}
              />
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {/* 操作区 */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Space>
            <Button
              type="primary"
              size="large"
              onClick={() => setModalOpen(true)}
              loading={isRunning}
              disabled={isRunning}
            >
              {isFetching ? "拉取中..." : "🔄 立即拉取文章"}
            </Button>
            <Button onClick={() => statusQuery.refetch()} loading={statusQuery.isFetching}>
              刷新状态
            </Button>
            <Popconfirm
              title="确定删除所有文章吗？"
              description="此操作将删除所有文章、生词标注和阅读进度，且不可恢复。"
              onConfirm={handleDelete}
              okText="确认删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button danger loading={isDeleting} disabled={isFetching}>
                🗑 删除所有文章
              </Button>
            </Popconfirm>
          </Space>
          {isFetching && (
            <Alert
              message="文章拉取正在进行中，请稍候..."
              description="系统正在从 China Daily 爬取文章并通过 AI 生成问答和生词标注，可能需要 5-8 分钟。"
              type="info"
              showIcon
            />
          )}
        </Space>
      </Card>

      {/* 拉取结果 */}
      {isRunning ? (
        <Card>
          <Spin tip="拉取任务进行中，页面将自动刷新状态...">
            <div style={{ minHeight: 60 }} />
          </Spin>
        </Card>
      ) : displayResult && displayResult.inserted !== undefined ? (
        <Card title="最近拉取结果">
          <Spin spinning={statusQuery.isLoading}>
            {/* 汇总信息 */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <Tag color="processing">采集：{displayResult.fetched} 篇</Tag>
              <Tag color="success">入库：{displayResult.inserted} 篇</Tag>
              <Tag color="warning">跳过(重复)：{displayResult.skipped} 篇</Tag>
              {displayResult.failed > 0 && <Tag color="error">失败：{displayResult.failed} 篇</Tag>}
              <Tag>耗时：{(displayResult.durationMs / 1000).toFixed(1)}s</Tag>
              {displayResult.timestamp && (
                <Tag>{new Date(displayResult.timestamp).toLocaleString("zh-CN")}</Tag>
              )}
            </div>

            {/* 各源贡献 */}
            {displayResult.sourceDetails && displayResult.sourceDetails.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>各数据源贡献：</Text>
                <Table
                  dataSource={displayResult.sourceDetails.map((s, i) => ({ ...s, key: i }))}
                  columns={[
                    { title: "数据源", dataIndex: "sourceName", key: "sourceName" },
                    { title: "拉取数", dataIndex: "fetched", key: "fetched" },
                    {
                      title: "状态",
                      key: "status",
                      render: (_: unknown, record: { fetched: number; errors: string[] }) =>
                        record.errors.length > 0 ? (
                          <Tag color="error">有错误</Tag>
                        ) : record.fetched === 0 ? (
                          <Tag color="warning">无数据</Tag>
                        ) : (
                          <Tag color="success">正常</Tag>
                        ),
                    },
                  ]}
                  pagination={false}
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </div>
            )}

            {/* 错误详情 */}
            {displayResult.errors && displayResult.errors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text type="danger" strong>
                  错误详情（{displayResult.errors.length} 条）：
                </Text>
                <div
                  style={{
                    background: "#fff2f0",
                    border: "1px solid #ffccc7",
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 8,
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  {displayResult.errors.slice(0, 20).map((err, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#cf1322", marginBottom: 4 }}>
                      {err}
                    </div>
                  ))}
                  {displayResult.errors.length > 20 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ... 还有 {displayResult.errors.length - 20} 条错误未显示
                    </Text>
                  )}
                </div>
              </div>
            )}
          </Spin>
        </Card>
      ) : (
        statusQuery.isSuccess && (
          <Card>
            <Text type="secondary">尚未执行过文章拉取，点击上方按钮开始。</Text>
          </Card>
        )
      )}

      {/* 文章翻译管理 */}
      <Card title="📝 文章翻译管理" style={{ marginTop: 24 }}>
        <Paragraph type="secondary">
          对指定文章调用 DeepSeek 重新生成
          <span style={{ fontWeight: 600 }}>句子级中英对照翻译</span>。
          适用于旧格式文章升级为逐句对照格式。
        </Paragraph>
        <Space>
          <Input
            placeholder="输入文章 ID"
            value={retranslateId}
            onChange={(e) => setRetranslateId(e.target.value)}
            style={{ width: 150 }}
          />
          <Button
            type="primary"
            onClick={handleRetranslate}
            loading={isRetranslating}
            disabled={isRetranslating}
          >
            {isRetranslating ? "翻译中..." : "重新翻译"}
          </Button>
        </Space>

        {/* 翻译结果预览 */}
        {retranslateResult && (
          <Card
            size="small"
            style={{ marginTop: 16, background: retranslateResult.success ? "#f6ffed" : "#fff2f0" }}
          >
            <Paragraph
              style={{
                marginBottom: 8,
                color: retranslateResult.success ? "#52c41a" : "#ff4d4f",
                fontWeight: 600,
              }}
            >
              {retranslateResult.success ? "✅" : "❌"} {retranslateResult.message}
            </Paragraph>
            {retranslateResult.preview && retranslateResult.preview.length > 0 && (
              <div style={{ lineHeight: 1.8, fontSize: 14 }}>
                <Text strong style={{ display: "block", marginBottom: 4 }}>
                  翻译预览（前 3 句）：
                </Text>
                {retranslateResult.preview.map((s, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{s.en}</div>
                    <div
                      style={{
                        paddingLeft: 12,
                        borderLeft: "3px solid #1677ff",
                        color: "#555",
                      }}
                    >
                      {s.zh}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </Card>

      {/* 说明区 */}
      <Card title="使用说明" size="small" style={{ marginTop: 24 }}>
        <ul style={{ paddingLeft: 20, color: "#666", lineHeight: 2 }}>
          <li>
            文章来自 <strong>China Daily</strong>（中国日报英文版），国内直连无需代理
          </li>
          <li>覆盖 world / china / business / life / tech 五个频道</li>
          <li>自动按频道+字数分级为 primary / junior / senior / college 四个年级</li>
          <li>每个年级爬取约 20 篇，4 个年级共约 80 篇</li>
          <li>
            <strong>DeepSeek AI</strong> 为每篇文章生成 4 道阅读理解题和 5 个生词标注
          </li>
          <li>已存在的文章（标题重复）会自动跳过</li>
          <li>
            需要在 <code>.env</code> 文件中配置 <code>DEEPSEEK_API_KEY</code> 才能启用 AI 加工
          </li>
          <li>
            定时任务通过 <code>CRON_ENABLED=true</code> 开启（开发环境建议关闭）
          </li>
        </ul>
      </Card>
    </div>
  );
}

export default AdminPage;
