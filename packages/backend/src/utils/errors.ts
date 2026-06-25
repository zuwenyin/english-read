/**
 * 统一错误响应格式
 * {
 *   code: number,
 *   message: string,
 *   data: null
 * }
 */

export enum ERROR_CODES {
  SUCCESS = 0,
  BAD_REQUEST = 40001,
  UNAUTHORIZED = 40101,
  FORBIDDEN = 40301,
  NOT_FOUND = 40401,
  INTERNAL_ERROR = 50001,
}

/**
 * 业务异常类，可携带错误码
 */
export class AppError extends Error {
  public code: ERROR_CODES;

  constructor(code: ERROR_CODES, message: string) {
    super(message);
    this.code = code;
    this.name = "AppError";
  }
}
