import { Request, Response, NextFunction } from "express";
import { AppError, ERROR_CODES } from "../utils/errors";
import { fail } from "../utils/response";
import { logger } from "../utils/logger";

/**
 * 统一错误处理中间件
 * 捕获所有异常，根据错误类型返回对应的错误码和统一格式
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(`[Error] ${err.message}`, { stack: err.stack });

  if (err instanceof AppError) {
    fail(res, err.code, err.message);
    return;
  }

  // 未知错误统一返回 50001
  fail(res, ERROR_CODES.INTERNAL_ERROR, "服务器内部错误");
}
