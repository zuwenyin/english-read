import winston from "winston";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// 开发环境：带颜色的可读格式
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack }) => {
    const log = `${timestamp} ${level}: ${message}`;
    return stack ? `${log}\n${stack}` : log;
  }),
);

// 生产环境：JSON 格式
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const isProduction = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: isProduction ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    // 生产环境可添加 File transport
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
