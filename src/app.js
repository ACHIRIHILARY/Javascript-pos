import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import v1Routes from "./routes/v1/index.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(requestLogger);

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  app.use("/api/v1", v1Routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
