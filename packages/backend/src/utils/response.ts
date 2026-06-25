import { Response } from "express";

/**
 * 统一成功响应
 * { code: 0, message: "success", data }
 */
export function success<T>(res: Response, data: T, message = "success"): void {
  res.json({
    code: 0,
    message,
    data,
  });
}

/**
 * 统一失败响应
 * { code, message, data: null }
 */
export function fail(res: Response, code: number, message: string): void {
  res.json({
    code,
    message,
    data: null,
  });
}
