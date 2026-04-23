import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,
  jwtSecret: process.env.JWT_SECRET || "change-me-to-32+chars-secret",
  jwtExpiry: process.env.JWT_EXPIRY || "8h",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
