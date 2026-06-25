export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  dbType: process.env.DB_TYPE || "sqlite",
  dbPath: process.env.DB_PATH || "./data/english-read.db",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
};
