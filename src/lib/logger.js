import { createLogger, format, transports } from "winston";
import fs from "node:fs";
import { env } from "../config/env.js";

fs.mkdirSync("logs", { recursive: true });

const loggerFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

export const logger = createLogger({
  level: env.nodeEnv === "production" ? "info" : "debug",
  format: loggerFormat,
  defaultMeta: { service: "javascript-pos-backend" },
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});
