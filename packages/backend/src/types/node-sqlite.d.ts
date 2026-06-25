declare module "node:sqlite" {
  class StatementSync {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    values(...params: unknown[]): unknown[][];
  }

  class DatabaseSync {
    constructor(path: string, options?: { open?: boolean });
    prepare(sql: string): StatementSync;
    exec(sql: string): void;
    close(): void;
    open(): void;
  }

  export { DatabaseSync, StatementSync };
}
