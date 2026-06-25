import { useState } from "react";
import { NavLink, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../store/AuthContext";
import { Layout as AntLayout, Button, Typography, Space, Drawer } from "./antd-wrapper";

const { Header, Content } = AntLayout;
const { Text } = Typography;

const tabs = [
  { path: "/", label: "首页", icon: "🏠" },
  { path: "/words", label: "单词", icon: "📝" },
  { path: "/reading", label: "阅读", icon: "📖" },
  { path: "/profile", label: "我的", icon: "👤" },
];

function AppLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 需要登录的 tab 点击时，未登录跳转登录页
  const handleTabClick = (path: string) => {
    setDrawerOpen(false);
    const authRequired = ["/words", "/reading", "/profile"].some((r) => path.startsWith(r));
    if (authRequired && !isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate(path);
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      {/* ====== PC 端顶部导航 (≥ 992px) ====== */}
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
        className="pc-nav"
      >
        {/* Logo */}
        <Text strong style={{ color: "#fff", fontSize: 18, marginRight: 32 }}>
          📖 English Read
        </Text>

        {/* 导航链接 */}
        <Space size="large" style={{ flex: 1 }}>
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick(tab.path);
              }}
              style={{
                color: location.pathname === tab.path ? "#fff" : "rgba(255,255,255,0.7)",
                fontWeight: location.pathname === tab.path ? 600 : 400,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              {tab.label}
            </NavLink>
          ))}
        </Space>

        {/* 用户区 */}
        <Space>
          {isAuthenticated ? (
            <>
              <span style={{ color: "#fff" }}>👤</span>
              <Text style={{ color: "#fff" }}>{user?.username}</Text>
              <Button
                type="link"
                onClick={() => {
                  logout();
                  queryClient.clear();
                  navigate("/");
                }}
                style={{ color: "#fff" }}
              >
                退出
              </Button>
            </>
          ) : (
            <Button type="link" onClick={() => navigate("/login")} style={{ color: "#fff" }}>
              登录
            </Button>
          )}
        </Space>
      </Header>

      {/* ====== 平板端顶部导航 (576-992px)：折叠式汉堡菜单 ====== */}
      <Header
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
        className="tablet-nav"
      >
        <Text strong style={{ color: "#fff", fontSize: 16 }}>
          📖 English Read
        </Text>

        <Button
          type="text"
          onClick={() => setDrawerOpen(true)}
          style={{ color: "#fff", fontSize: 20 }}
        >
          ☰
        </Button>

        {/* 汉堡菜单抽屉 */}
        <Drawer
          title="导航菜单"
          placement="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={250}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tabs.map((tab) => (
              <Button
                key={tab.path}
                type={location.pathname === tab.path ? "primary" : "default"}
                block
                size="large"
                onClick={() => handleTabClick(tab.path)}
                style={{
                  textAlign: "left",
                  background: location.pathname === tab.path ? "#764ba2" : undefined,
                  borderColor: location.pathname === tab.path ? "#764ba2" : undefined,
                }}
              >
                <span style={{ marginRight: 8 }}>{tab.icon}</span>
                {tab.label}
              </Button>
            ))}

            <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 8, paddingTop: 8 }}>
              {isAuthenticated ? (
                <div>
                  <Text strong>👤 {user?.username}</Text>
                  <Button
                    danger
                    block
                    size="large"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      setDrawerOpen(false);
                      logout();
                      queryClient.clear();
                      navigate("/");
                    }}
                  >
                    退出登录
                  </Button>
                </div>
              ) : (
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate("/login");
                  }}
                >
                  登录
                </Button>
              )}
            </div>
          </div>
        </Drawer>
      </Header>

      {/* 内容区 */}
      <Content className="app-content" style={{ padding: 0 }}>
        <Outlet />
      </Content>

      {/* ====== 手机端底部 Tab 导航 (< 576px) ====== */}
      <div
        className="mobile-nav"
        style={{
          display: "none",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            height: "100%",
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.path}
              onClick={() => handleTabClick(tab.path)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                color: location.pathname === tab.path ? "#764ba2" : "#999",
                fontSize: 12,
              }}
            >
              <span style={{ fontSize: 18, marginBottom: 2 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 响应式样式 */}
      <style>{`
        /* PC: ≥ 992px — 顶部导航栏 */
        @media (min-width: 992px) {
          .pc-nav { display: flex !important; }
          .tablet-nav { display: none !important; }
          .mobile-nav { display: none !important; }
          .app-content { padding-bottom: 0; }
        }

        /* 平板: 576-991px — 折叠式顶部导航 */
        @media (min-width: 576px) and (max-width: 991px) {
          .pc-nav { display: none !important; }
          .tablet-nav { display: flex !important; }
          .mobile-nav { display: none !important; }
          .app-content { padding-bottom: 0; }
        }

        /* 手机: < 576px — 底部 Tab 导航 */
        @media (max-width: 575px) {
          .pc-nav { display: none !important; }
          .tablet-nav { display: none !important; }
          .mobile-nav { display: block !important; }
          .app-content { padding-bottom: 56px; }
        }
      `}</style>
    </AntLayout>
  );
}

export default AppLayout;
