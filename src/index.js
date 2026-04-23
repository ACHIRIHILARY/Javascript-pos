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
let server;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("database_connected", {
      provider: "postgresql",
    });

    server = app.listen(env.port, () => {
      logger.info("server_started", {
        message: `Server listening on port ${env.port}`,
        port: env.port,
        nodeEnv: env.nodeEnv,
        apiVersionBasePath: "/api/v1",
      });
    });
  } catch (error) {
    logger.error("startup_failed", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

bootstrap();
//});

const gracefulShutdown = async () => {
  logger.info("shutdown_started");
  await prisma.$disconnect();
  if (server) {
    server.close(() => {
      logger.info("server_stopped");
      process.exit(0);
    });
    return;
  }
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
