import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

process.on("uncaughtException", (error) => {
  logger.error("uncaught_exception", { message: error.message, stack: error.stack });
});

process.on("unhandledRejection", (reason) => {
  logger.error("unhandled_rejection", { reason });
});

const server = app.listen(env.port, () => {
  logger.info("server_started", {
    port: env.port,
    nodeEnv: env.nodeEnv,
    apiVersionBasePath: "/api/v1",
  });
});

const gracefulShutdown = async () => {
  logger.info("shutdown_started");
  await prisma.$disconnect();
  server.close(() => {
    logger.info("server_stopped");
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
