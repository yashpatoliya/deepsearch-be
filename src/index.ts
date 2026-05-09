// ============================================================
// src/index.ts — Application entry point
// ============================================================

import "dotenv/config";
import { buildServer } from "./api/server.js";
import { getRedisClient } from "./services/redisClient.js";
import logger from "./utils/logger.js";
import config from "./config/index.js";

async function main() {
  logger.info("Deep Research Engine starting...");

  // Pre-connect Redis
  try {
    const redis = getRedisClient();
    await redis.connect();
    logger.info("Redis: pre-connection successful");
  } catch (err) {
    logger.warn(
      { err },
      "Redis: pre-connection failed, will retry on first use",
    );
  }

  // Build and start Express
  const server = await buildServer();

  try {
    await server.listen({ port: config.port, host: config.host });
    logger.info(
      { port: config.port, host: config.host, env: config.nodeEnv },
      `🚀 Deep Research Engine running on http://${config.host}:${config.port}`,
    );
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error({ err }, "Fatal error in main");
  process.exit(1);
});
