import type { ReactNode } from "react";
import { Typography } from "./antd-wrapper";

const { Title, Text, Paragraph } = Typography;

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div style={containerStyle}>
      {/* 左侧品牌区 */}
      <div className="auth-left" style={leftStyle}>
        <div style={leftContentStyle}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
          <Title level={2} style={{ color: "#fff", marginBottom: 8 }}>
            English Read
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 16 }}>英语阅读伴侣</Text>
          <Paragraph
            style={{
              color: "rgba(255,255,255,0.6)",
              marginTop: 32,
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            每天一点阅读
            <br />
            遇见更大的世界
          </Paragraph>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="auth-right" style={rightStyle}>
        <div style={formWrapperStyle}>
          <Title level={3} style={{ textAlign: "center", marginBottom: 4 }}>
            {title}
          </Title>
          {subtitle && (
            <Text
              type="secondary"
              style={{
                display: "block",
                textAlign: "center",
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              {subtitle}
            </Text>
          )}
          {children}
        </div>
      </div>

      {/* 响应式 */}
      <style>{`
        @media (max-width: 768px) {
          .auth-left {
            display: none !important;
          }
          .auth-right {
            flex: 1 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  minHeight: "100vh",
};

const leftStyle: React.CSSProperties = {
  flex: "0 0 42%",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 48,
};

const leftContentStyle: React.CSSProperties = {
  textAlign: "center",
  maxWidth: 360,
};

const rightStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f5f5",
  padding: 24,
};

const formWrapperStyle: React.CSSProperties = {
  width: 400,
  maxWidth: "100%",
  background: "#fff",
  padding: "40px 32px",
  borderRadius: 8,
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
};

export default AuthLayout;
