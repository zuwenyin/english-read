/**
 * AuthService 单元测试
 *
 * 覆盖：
 * - 注册成功 / 用户名重复 / 邮箱重复 / 参数校验失败
 * - 登录成功 / 密码错误 / 用户不存在
 * - Token 签发验证
 */

import { AuthService } from "../services/authService";
import { IUserRepository, UserRecord } from "../repositories/interfaces/IUserRepository";
import { AppError } from "../utils/errors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("mocked_hash"),
  compare: jest.fn(),
}));

// Mock jasonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mocked_token"),
}));

function mockUserRepo(overrides: Partial<IUserRepository> = {}): IUserRepository {
  return {
    findByUsername: jest.fn().mockResolvedValue(null),
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 1,
        username: data.username,
        email: data.email,
        password_hash: data.password_hash,
        created_at: "2025-01-01",
      }),
    ),
    findById: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe("AuthService", () => {
  describe("register", () => {
    it("注册成功 — 返回用户信息（不含 password_hash）", async () => {
      const repo = mockUserRepo();
      const service = new AuthService(repo);
      const data = { username: "newuser", email: "new@test.com", password: "123456" };

      const result = await service.register(data);

      expect(result).toEqual({
        id: 1,
        username: "newuser",
        email: "new@test.com",
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("123456", 10);
      expect(repo.create).toHaveBeenCalled();
    });

    it("用户名已存在 — 抛出 BAD_REQUEST", async () => {
      const repo = mockUserRepo({
        findByUsername: jest.fn().mockResolvedValue({ id: 2 } as UserRecord),
      });
      const service = new AuthService(repo);

      await expect(
        service.register({ username: "existing", email: "e@test.com", password: "123456" }),
      ).rejects.toThrow(AppError);

      await expect(
        service.register({ username: "existing", email: "e@test.com", password: "123456" }),
      ).rejects.toThrow("用户名已存在");
    });

    it("邮箱已存在 — 抛出 BAD_REQUEST", async () => {
      const repo = mockUserRepo({
        findByEmail: jest.fn().mockResolvedValue({ id: 3 } as UserRecord),
      });
      const service = new AuthService(repo);

      await expect(
        service.register({ username: "user", email: "used@test.com", password: "123456" }),
      ).rejects.toThrow("邮箱已存在");
    });

    it("参数校验失败 — 用户名太短", async () => {
      const repo = mockUserRepo();
      const service = new AuthService(repo);

      await expect(
        service.register({ username: "a", email: "a@test.com", password: "123456" }),
      ).rejects.toThrow(AppError);
    });

    it("参数校验失败 — 邮箱格式错误", async () => {
      const repo = mockUserRepo();
      const service = new AuthService(repo);

      await expect(
        service.register({ username: "validname", email: "not-email", password: "123456" }),
      ).rejects.toThrow(AppError);
    });

    it("参数校验失败 — 密码太短", async () => {
      const repo = mockUserRepo();
      const service = new AuthService(repo);

      await expect(
        service.register({ username: "validname", email: "a@test.com", password: "123" }),
      ).rejects.toThrow(AppError);
    });
  });

  describe("login", () => {
    const mockUser: UserRecord = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      password_hash: "correct_hash",
      created_at: "2025-01-01",
    };

    it("登录成功 — 返回 token 和用户信息", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const repo = mockUserRepo({
        findByUsername: jest.fn().mockResolvedValue(mockUser),
      });
      const service = new AuthService(repo);

      const result = await service.login({ username: "testuser", password: "right" });

      expect(result.token).toBe("mocked_token");
      expect(result.user).toEqual({
        id: 1,
        username: "testuser",
        email: "test@example.com",
      });
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 }, expect.any(String), { expiresIn: "7d" });
    });

    it("密码错误 — 抛出 UNAUTHORIZED", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const repo = mockUserRepo({
        findByUsername: jest.fn().mockResolvedValue(mockUser),
      });
      const service = new AuthService(repo);

      await expect(service.login({ username: "testuser", password: "wrong" })).rejects.toThrow(
        "用户名或密码错误",
      );
    });

    it("用户不存在 — 抛出 UNAUTHORIZED", async () => {
      const repo = mockUserRepo({
        findByUsername: jest.fn().mockResolvedValue(null),
      });
      const service = new AuthService(repo);

      await expect(service.login({ username: "nouser", password: "123456" })).rejects.toThrow(
        "用户名或密码错误",
      );
    });

    it("参数校验 — 缺少用户名", async () => {
      const repo = mockUserRepo();
      const service = new AuthService(repo);

      await expect(service.login({ username: "", password: "123456" })).rejects.toThrow(AppError);
    });

    it("Token 验证 — payload 包含正确的 userId", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("test_jwt_token");
      const repo = mockUserRepo({
        findByUsername: jest.fn().mockResolvedValue(mockUser),
      });
      const service = new AuthService(repo);

      const result = await service.login({ username: "testuser", password: "right" });

      expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 }, expect.any(String), { expiresIn: "7d" });
      expect(result.token).toBe("test_jwt_token");
    });
  });

  describe("getProfile", () => {
    it("获取用户资料成功", async () => {
      const repo = mockUserRepo({
        findById: jest.fn().mockResolvedValue({
          id: 1,
          username: "testuser",
          email: "test@example.com",
          password_hash: "should_not_return",
          created_at: "2025-01-01T00:00:00.000Z",
        }),
      });
      const service = new AuthService(repo);

      const result = await service.getProfile(1);

      expect(result).toEqual({
        id: 1,
        username: "testuser",
        email: "test@example.com",
        created_at: "2025-01-01T00:00:00.000Z",
      });
      // 确保不返回 password_hash
      expect((result as any).password_hash).toBeUndefined();
    });

    it("用户不存在", async () => {
      const repo = mockUserRepo({
        findById: jest.fn().mockResolvedValue(null),
      });
      const service = new AuthService(repo);

      await expect(service.getProfile(999)).rejects.toThrow("用户不存在");
    });
  });
});
