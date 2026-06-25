import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ERROR_CODES } from "../utils/errors";
import { fail } from "../utils/response";

/**
 * JWT 认证中间件
 * 验证 Authorization: Bearer <token> 头
 * 有效则将 userId 写入 req.user.id
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    fail(res, ERROR_CODES.UNAUTHORIZED, "未登录或Token已过期");
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: number };
    // 将 userId 挂载到 req 上（扩展 Express Request 类型）
    (req as AuthRequest).user = { id: payload.userId };
    next();
  } catch {
    fail(res, ERROR_CODES.UNAUTHORIZED, "未登录或Token已过期");
  }
}

/**
 * 扩展 Express Request，携带认证用户信息
 */
export interface AuthRequest extends Request {
  user: { id: number };
}
