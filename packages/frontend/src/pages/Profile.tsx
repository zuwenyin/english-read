import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import useMediaQuery from "../hooks/useMediaQuery";
import {
  Card,
  Typography,
  Statistic,
  Spin,
  Empty,
  Row,
  Col,
  Form,
  Input,
  Button,
  Divider,
  message,
} from "../components/antd-wrapper";
import { getStatsOverview, getRecentProgress } from "../api/stats";
import { updateProfile, type UpdateProfileParams } from "../api/auth";

const { Title, Text, Paragraph } = Typography;

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [emailForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const isMobile = useMediaQuery("(max-width: 575px)");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: getStatsOverview,
    staleTime: 30_000,
  });

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ["stats", "recent"],
    queryFn: getRecentProgress,
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (params: UpdateProfileParams) => updateProfile(params),
    onSuccess: (_data, variables) => {
      if (variables.email) {
        message.success("邮箱修改成功");
        // 同步更新本地用户名（user 来自 AuthContext，email 变了但不影响 context 中的 user）
        emailForm.setFieldsValue({ email: variables.email });
      }
      if (variables.password) {
        message.success("密码修改成功");
        passwordForm.resetFields();
      }
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const handleEmailSubmit = (values: { email: string }) => {
    updateMutation.mutate({ email: values.email });
  };

  const handlePasswordSubmit = (values: { password: string }) => {
    updateMutation.mutate({ password: values.password });
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate("/", { replace: true });
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <Title level={3}>个人中心</Title>

      {/* ======== 学习统计 ======== */}
      <Divider orientation="left">学习统计</Divider>
      {statsLoading ? (
        <Spin style={{ display: "block", margin: "20px auto" }} />
      ) : stats ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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
              <Statistic title="平均成绩" value={stats.avg_quiz_score} suffix="分" precision={0} />
            </Card>
          </Col>
        </Row>
      ) : (
        <Empty style={{ marginBottom: 24 }} description="暂无统计数据" />
      )}

      {/* ======== 最近学习 ======== */}
      <Divider orientation="left">最近学习</Divider>
      {recentLoading ? (
        <Spin style={{ display: "block", margin: "20px auto" }} />
      ) : recent ? (
        <Row gutter={[24, 16]} style={{ marginBottom: 24 }}>
          {/* 最近词书 */}
          <Col xs={24} sm={12}>
            <Card title="最近词书" size="small">
              {recent.recent_books.length > 0 ? (
                recent.recent_books.map((book) => (
                  <div
                    key={book.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <Text strong>{book.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {book.last_studied_at
                        ? `最近学习: ${new Date(book.last_studied_at).toLocaleDateString()}`
                        : "尚未学习"}
                    </Text>
                  </div>
                ))
              ) : (
                <Empty description="暂无记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>

          {/* 最近文章 */}
          <Col xs={24} sm={12}>
            <Card title="最近文章" size="small">
              {recent.recent_articles.length > 0 ? (
                recent.recent_articles.map((article) => (
                  <div
                    key={article.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <Text strong>{article.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {article.last_read_at
                        ? new Date(article.last_read_at).toLocaleDateString()
                        : "尚未阅读"}
                    </Text>
                  </div>
                ))
              ) : (
                <Empty description="暂无记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>
      ) : (
        <Empty style={{ marginBottom: 24 }} description="暂无学习记录" />
      )}

      {/* ======== 账号信息 ======== */}
      <Divider orientation="left">账号信息</Divider>
      <Card style={{ marginBottom: 24 }}>
        <Paragraph>
          <Text strong>用户名：</Text>
          <Text>{user?.username}</Text>
          <Text type="secondary" style={{ marginLeft: 12 }}>
            （不可修改）
          </Text>
        </Paragraph>

        <Divider />

        {/* 修改邮箱 */}
        <Text strong style={{ display: "block", marginBottom: 12 }}>
          修改邮箱
        </Text>
        <Form
          form={emailForm}
          layout={isMobile ? "vertical" : "inline"}
          onFinish={handleEmailSubmit}
          initialValues={{ email: user?.email }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "邮箱格式不正确" },
            ]}
          >
            <Input placeholder="新邮箱地址" style={{ width: isMobile ? "100%" : 220 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              保存
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        {/* 修改密码 */}
        <Text strong style={{ display: "block", marginBottom: 12 }}>
          修改密码
        </Text>
        <Form
          form={passwordForm}
          layout={isMobile ? "vertical" : "inline"}
          onFinish={handlePasswordSubmit}
        >
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "密码至少6个字符" },
            ]}
          >
            <Input.Password placeholder="新密码" style={{ width: isMobile ? "100%" : 220 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* ======== 退出登录 ======== */}
      <Button danger block onClick={handleLogout}>
        退出登录
      </Button>
    </div>
  );
}

export default Profile;
