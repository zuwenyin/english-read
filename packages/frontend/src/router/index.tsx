import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { Spin } from "../components/antd-wrapper";
import Layout from "../components/Layout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Words from "../pages/Words";
import WordLearn from "../pages/WordLearn";
import WordQuiz from "../pages/WordQuiz";
import Reading from "../pages/Reading";
import ReadingDetail from "../pages/ReadingDetail";
import ReadingResult from "../pages/ReadingResult";
import Profile from "../pages/Profile";
import Admin from "../pages/Admin";
import type { ReactNode } from "react";

// 路由守卫：需要登录才能访问
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <Spin style={{ display: "flex", justifyContent: "center", marginTop: 80 }} />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// 路由守卫：已登录则跳转首页（用于 login/register 页）
function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <Spin style={{ display: "flex", justifyContent: "center", marginTop: 80 }} />;
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 独立页面：不套 Layout */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* 业务页面：套 Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/words"
            element={
              <ProtectedRoute>
                <Words />
              </ProtectedRoute>
            }
          />
          <Route
            path="/words/learn/:bookId"
            element={
              <ProtectedRoute>
                <WordLearn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/words/quiz/:bookId"
            element={
              <ProtectedRoute>
                <WordQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reading"
            element={
              <ProtectedRoute>
                <Reading />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reading/:id/result"
            element={
              <ProtectedRoute>
                <ReadingResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reading/:id"
            element={
              <ProtectedRoute>
                <ReadingDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
