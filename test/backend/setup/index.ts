import { beforeAll, beforeEach } from 'bun:test'
import {
  assertBackendDatabaseReady,
  assertBackendRedisReady,
  resetBackendDatabase,
  resetBackendRedis,
} from '@test/backend/setup/db'

type IntegrationOptions = {
  redis?: boolean
}

export function installBackendIntegrationHooks({ redis = false }: IntegrationOptions = {}) {
  beforeAll(async () => {
    await assertBackendDatabaseReady()

    if (redis) {
      await assertBackendRedisReady()
    }
  })

  beforeEach(async () => {
    await resetBackendDatabase()

    if (redis) {
      await resetBackendRedis()
    }
  })
}
