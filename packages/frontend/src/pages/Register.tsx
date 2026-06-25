import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { register as registerApi } from "../api/auth";
import { Form, Input, Button, Typography, message } from "../components/antd-wrapper";
import AuthLayout from "../components/AuthLayout";

const { Text } = Typography;

function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error("两次密码输入不一致");
      return;
    }

    setLoading(true);
    try {
      await registerApi({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      message.success("注册成功，请登录");
      navigate("/login");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="注册" subtitle="创建账号，开启英语阅读之旅">
      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: "请输入用户名" },
            { min: 2, message: "用户名至少2个字符" },
            { max: 30, message: "用户名最多30个字符" },
          ]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: "请输入邮箱" },
            { type: "email", message: "邮箱格式不正确" },
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: "请输入密码" },
            { min: 6, message: "密码至少6个字符" },
          ]}
        >
          <Input.Password placeholder="请输入密码（至少6个字符）" />
        </Form.Item>
        <Form.Item
          label="确认密码"
          name="confirmPassword"
          rules={[
            { required: true, message: "请确认密码" },
            ({ getFieldValue }: { getFieldValue: (name: string) => string }) => ({
              validator(_: unknown, value: string) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("两次密码输入不一致"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            注册
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: "center" }}>
        <Text>
          已有账号？<NavLink to="/login">去登录</NavLink>
        </Text>
      </div>
    </AuthLayout>
  );
}

export default Register;
