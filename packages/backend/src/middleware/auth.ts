import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ERROR_CODES } from "../utils/errors";
import { fail } from "../utils/response";

// 全局扩展 Express Request 类型，添加 user 字段
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

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
    req.user = { id: payload.userId };
    next();
  } catch {
    fail(res, ERROR_CODES.UNAUTHORIZED, "未登录或Token已过期");
  }
}
