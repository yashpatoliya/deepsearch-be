// ============================================================
// src/services/redisClient.ts — Redis connection singleton
// ============================================================

import { Redis } from "ioredis";
import config from "../config/index.js";
import logger from "../utils/logger.js";

let client: Redis | null = null;
let bullMQClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) {
    client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        if (times > 5) {
          logger.error("Redis: max retry attempts exceeded");
          return null; // Stop retrying
        }
        return Math.min(times * 500, 3000);
      },
    });

    client.on("connect", () => logger.info("Redis: connected"));
    client.on("error", (err) =>
      logger.error({ err }, "Redis: connection error"),
    );
    client.on("reconnecting", () => logger.warn("Redis: reconnecting..."));
  }
  return client;
}

// BullMQ-compatible Redis client (no maxRetriesPerRequest)
export function getBullMQRedisClient(): Redis {
  if (!bullMQClient) {
    bullMQClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      lazyConnect: true,
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: true,
    });

    bullMQClient.on("connect", () => logger.info("Redis (BullMQ): connected"));
    bullMQClient.on("error", (err) =>
      logger.error({ err }, "Redis (BullMQ): connection error"),
    );
  }
  return bullMQClient;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    logger.info("Redis: connection closed");
  }
}

// ============================================================
// Cache helper methods
// ============================================================

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    logger.warn({ err, key }, "Cache get failed");
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn({ err, key }, "Cache set failed");
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (err) {
    logger.warn({ err, key }, "Cache delete failed");
  }
}

export function buildQueryCacheKey(query: string): string {
  return `research:query:${query.toLowerCase().trim().replace(/\s+/g, "_")}`;
}

export function buildPageCacheKey(url: string): string {
  return `research:page:${Buffer.from(url).toString("base64")}`;
}
