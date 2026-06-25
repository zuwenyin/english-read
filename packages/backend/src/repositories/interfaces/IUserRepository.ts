/**
 * IUserRepository — 用户数据访问接口
 *
 * 定义用户相关数据操作的契约，具体实现见 repositories/sqlite/
 */
export interface IUserRepository {
  /** 通过用户名查找用户 */
  findByUsername(username: string): Promise<UserRecord | null>;
  /** 通过邮箱查找用户 */
  findByEmail(email: string): Promise<UserRecord | null>;
  /** 创建新用户 */
  create(data: CreateUserInput): Promise<UserRecord>;
  /** 通过 ID 查找用户 */
  findById(id: number): Promise<UserRecord | null>;
  /** 更新用户信息 */
  update(id: number, data: UpdateUserInput): Promise<UserRecord | null>;
}

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password_hash: string;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  password_hash?: string;
}
