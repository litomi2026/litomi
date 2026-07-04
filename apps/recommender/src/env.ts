import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    OPENSEARCH_URL: z.url().default('http://localhost:9200'),
    OPENSEARCH_USERNAME: z.string().optional(),
    OPENSEARCH_PASSWORD: z.string().optional(),

    OPENSEARCH_MANGA_INDEX_ALIAS: z
      .string()
      .regex(/^[a-z0-9][a-z0-9._-]*$/)
      .default('litomi-manga'),

    OPENSEARCH_MANGA_INDEX_SHARDS: z.coerce.number().int().positive().default(1),
    OPENSEARCH_MANGA_INDEX_REPLICAS: z.coerce.number().int().min(0).default(0),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
