import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

import { DEFAULT_VAPID_PUBLIC_KEY } from './shared'

export const env = createEnv({
  server: {
    APP_ORIGIN: z.url().default('http://localhost:3000'),
    APP_POSTGRES_URL: z.url().default('postgresql://test_user:test_password@localhost:5434/app_db'),
    APP_POSTGRES_CERTIFICATE: z.string().optional(),
    APP_POSTGRES_POOL_MAX: z.coerce.number().int().positive().default(2),
    APP_POSTGRES_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
    APP_POSTGRES_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
    APP_POSTGRES_APPLICATION_NAME: z.string().default('litomi-app-local'),
    CATALOG_POSTGRES_URL: z.url().default('postgresql://test_user:test_password@localhost:5435/catalog_db'),
    CATALOG_POSTGRES_CERTIFICATE: z.string().optional(),
    CATALOG_POSTGRES_POOL_MAX: z.coerce.number().int().positive().default(3),
    CATALOG_POSTGRES_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
    CATALOG_POSTGRES_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
    CATALOG_POSTGRES_APPLICATION_NAME: z.string().default('litomi-catalog-local'),
    CHAT_POSTGRES_URL: z.url().default('postgresql://test_user:test_password@localhost:5436/chat_db'),
    CHAT_POSTGRES_CERTIFICATE: z.string().optional(),
    CHAT_POSTGRES_POOL_MAX: z.coerce.number().int().positive().default(3),
    CHAT_POSTGRES_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
    CHAT_POSTGRES_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
    CHAT_POSTGRES_APPLICATION_NAME: z.string().default('litomi-chat-local'),
    JWT_SECRET_ACCESS_TOKEN: z.string().default('123'),
    JWT_SECRET_REFRESH_TOKEN: z.string().default('456'),
    JWT_SECRET_TRUSTED_DEVICE: z.string().default('789'),
    KAFKA_BROKERS: z.string().default('localhost:9092'),
    KAFKA_CLIENT_ID: z.string().default('litomi'),
    KAFKA_USERNAME: z.string().optional(),
    KAFKA_PASSWORD: z.string().optional(),
    KAFKA_SSL_CA: z.string().optional(),
    OPENSEARCH_URL: z.url().default('http://localhost:9200'),
    OPENSEARCH_USERNAME: z.string().optional(),
    OPENSEARCH_PASSWORD: z.string().optional(),

    OPENSEARCH_MANGA_INDEX_ALIAS: z
      .string()
      .regex(/^[a-z0-9][a-z0-9._-]*$/)
      .default('litomi-manga'),
      
    OPENSEARCH_MANGA_INDEX_SHARDS: z.coerce.number().int().positive().default(1),
    OPENSEARCH_MANGA_INDEX_REPLICAS: z.coerce.number().int().min(0).default(0),
    PORTONE_API_SECRET: z.string().optional(),
    PORTONE_CHANNEL_KEY: z.string().optional(),
    PORTONE_STORE_ID: z.string().optional(),
    PORTONE_WEBHOOK_SECRET: z.string().optional(),
    PUBSUB_REDIS_URL: z.url().default('redis://localhost:6381'),
    REDIS_URL: z.url().default('redis://localhost:6380'),

    TOTP_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-f]{64}$/i, 'TOTP_ENCRYPTION_KEY must be a 64-character hex string')
      .default('1111111111111111111111111111111111111111111111111111111111111111'),

    TURNSTILE_SECRET_KEY: z.string().default('1x0000000000000000000000000000000AA'),
    VAPID_PUBLIC_KEY: z.string().default(DEFAULT_VAPID_PUBLIC_KEY),
    VAPID_PRIVATE_KEY: z.string().default('pL4WSwlV1gHQUYZOOq7N1oEq0Gbj-_dWnRwph1-Ju0k'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
