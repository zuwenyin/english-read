import type { DatabaseSync } from "node:sqlite";
import {
  IUserRepository,
  UserRecord,
  CreateUserInput,
  UpdateUserInput,
} from "../interfaces/IUserRepository";

export class SqliteUserRepository implements IUserRepository {
  constructor(private db: DatabaseSync) {}

  findByUsername(username: string): Promise<UserRecord | null> {
    const row = this.db.prepare("SELECT * FROM users WHERE username = ?").get<UserRecord>(username);
    return Promise.resolve(row ?? null);
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    const row = this.db.prepare("SELECT * FROM users WHERE email = ?").get<UserRecord>(email);
    return Promise.resolve(row ?? null);
  }

  create(data: CreateUserInput): Promise<UserRecord> {
    const stmt = this.db.prepare(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
    );
    const result = stmt.run(data.username, data.email, data.password_hash);
    return this.findById(Number(result.lastInsertRowid)) as Promise<UserRecord>;
  }

  findById(id: number): Promise<UserRecord | null> {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get<UserRecord>(id);
    return Promise.resolve(row ?? null);
  }

  update(id: number, data: UpdateUserInput): Promise<UserRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.username !== undefined) {
      sets.push("username = ?");
      values.push(data.username);
    }
    if (data.email !== undefined) {
      sets.push("email = ?");
      values.push(data.email);
    }
    if (data.password_hash !== undefined) {
      sets.push("password_hash = ?");
      values.push(data.password_hash);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    this.db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...values);

    return this.findById(id);
  }
}
