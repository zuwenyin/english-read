import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";
import { IUserRepository } from "../repositories/interfaces/IUserRepository";
import { AppError, ERROR_CODES } from "../utils/errors";

// --- Zod schemas ---

const registerSchema = z.object({
  username: z.string().min(2, "用户名至少2个字符").max(30, "用户名最多30个字符"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6个字符").max(50, "密码最多50个字符"),
});

const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

const updateProfileSchema = z.object({
  email: z.string().email("邮箱格式不正确").optional(),
  password: z.string().min(6, "密码至少6个字符").optional(),
});

// --- Service ---

export class AuthService {
  constructor(private userRepo: IUserRepository) {}

  /**
   * 用户注册
   */
  async register(data: unknown) {
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, parsed.error.errors[0].message);
    }

    const { username, email, password } = parsed.data;

    // 检查用户名是否已存在
    const existingUser = await this.userRepo.findByUsername(username);
    if (existingUser) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "用户名已存在");
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepo.findByEmail(email);
    if (existingEmail) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "邮箱已存在");
    }

    // 密码加密
    const password_hash = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.userRepo.create({ username, email, password_hash });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }

  /**
   * 用户登录
   */
  async login(data: unknown) {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, parsed.error.errors[0].message);
    }

    const { username, password } = parsed.data;

    // 查找用户
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, "用户名或密码错误");
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, "用户名或密码错误");
    }

    // 签发 JWT（7 天有效）
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: "7d",
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  /**
   * 获取当前用户资料（不含 password_hash）
   */
  async getProfile(userId: number) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "用户不存在");
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    };
  }

  /**
   * 更新用户资料（邮箱或密码）
   */
  async updateProfile(userId: number, data: unknown) {
    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, parsed.error.errors[0].message);
    }

    if (!parsed.data.email && !parsed.data.password) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "至少需要提供邮箱或密码");
    }

    const updateData: { email?: string; password_hash?: string } = {};

    if (parsed.data.email) {
      // 检查邮箱是否已被其他用户使用
      const existingEmail = await this.userRepo.findByEmail(parsed.data.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new AppError(ERROR_CODES.BAD_REQUEST, "邮箱已被其他用户使用");
      }
      updateData.email = parsed.data.email;
    }

    if (parsed.data.password) {
      updateData.password_hash = await bcrypt.hash(parsed.data.password, 10);
    }

    const user = await this.userRepo.update(userId, updateData);
    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "用户不存在");
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }
}
