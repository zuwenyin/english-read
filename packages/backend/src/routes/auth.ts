import { Router } from "express";
import { AuthService } from "../services/authService";
import { authMiddleware } from "../middleware/auth";
import { IUserRepository } from "../repositories/interfaces/IUserRepository";
import { success } from "../utils/response";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 用户认证相关接口
 */

/**
 * 创建认证路由
 */
export function createAuthRoutes(userRepo: IUserRepository): Router {
  const router = Router();
  const authService = new AuthService(userRepo);

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: 用户注册
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [username, email, password]
   *             properties:
   *               username: { type: string }
   *               email: { type: string, format: email }
   *               password: { type: string, minLength: 6 }
   *     responses:
   *       200: { description: 注册成功 }
   */
  router.post("/register", async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      success(res, result, "注册成功");
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: 用户登录
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [username, password]
   *             properties:
   *               username: { type: string }
   *               password: { type: string }
   *     responses:
   *       200: { description: 登录成功，返回 JWT token }
   */
  router.post("/login", async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      success(res, result, "登录成功");
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     tags: [Auth]
   *     summary: 获取当前用户资料
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: 用户资料 }
   */
  router.get("/profile", authMiddleware, async (req, res, next) => {
    try {
      const result = await authService.getProfile(req.user!.id);
      success(res, result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   * /api/auth/profile:
   *   put:
   *     tags: [Auth]
   *     summary: 更新用户资料（邮箱或密码）
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string, minLength: 6 }
   *     responses:
   *       200: { description: 更新成功 }
   */
  router.put("/profile", authMiddleware, async (req, res, next) => {
    try {
      const result = await authService.updateProfile(req.user!.id, req.body);
      success(res, result, "更新成功");
    } catch (err) {
      next(err);
    }
  });

  return router;
}
