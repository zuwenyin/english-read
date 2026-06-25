import { Router } from "express";
import { AuthService } from "../services/authService";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { IUserRepository } from "../repositories/interfaces/IUserRepository";
import { success } from "../utils/response";

/**
 * 创建认证路由
 */
export function createAuthRoutes(userRepo: IUserRepository): Router {
  const router = Router();
  const authService = new AuthService(userRepo);

  // POST /api/auth/register — 用户注册
  router.post("/register", async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      success(res, result, "注册成功");
    } catch (err) {
      next(err);
    }
  });

  // POST /api/auth/login — 用户登录
  router.post("/login", async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      success(res, result, "登录成功");
    } catch (err) {
      next(err);
    }
  });

  // GET /api/auth/profile — 获取当前用户资料（需要认证）
  router.get("/profile", authMiddleware, async (req, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const result = await authService.getProfile(authReq.user.id);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/auth/profile — 更新用户资料（需要认证）
  router.put("/profile", authMiddleware, async (req, res, next) => {
    try {
      const authReq = req as AuthRequest;
      const result = await authService.updateProfile(authReq.user.id, req.body);
      success(res, result, "更新成功");
    } catch (err) {
      next(err);
    }
  });

  return router;
}
