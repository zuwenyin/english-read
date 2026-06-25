import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { login as loginApi } from "../api/auth";
import { Form, Input, Button, Typography, message } from "../components/antd-wrapper";
import AuthLayout from "../components/AuthLayout";

const { Text } = Typography;

function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await loginApi(values);
      login(result.token, result.user);
      message.success("登录成功");
      navigate("/");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="登录" subtitle="欢迎回来，继续你的英语之旅">
      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: "请输入用户名" }]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
          <Input.Password placeholder="请输入密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: "center" }}>
        <Text>
          没有账号？<NavLink to="/register">去注册</NavLink>
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          忘记密码？请联系管理员重置
        </Text>
      </div>
    </AuthLayout>
  );
}

export default Login;
