import { afterEach, beforeAll, beforeEach } from 'bun:test'
import { exec } from 'child_process'
import { sql } from 'drizzle-orm'
import { promisify } from 'util'

import { db } from '@/database/supabase/drizzle'

import { PerformanceDataSeeder } from './data-seeder'
import { PerformanceMetrics } from './performance-metrics'

const execAsync = promisify(exec)

export let metrics: PerformanceMetrics

beforeAll(async () => {
  console.log('🚀 Setting up performance tests...')

  try {
    await execAsync('bun drizzle-kit push --config=drizzle.supabase.config.ts', { timeout: 60000 })
    const dataSeeder = new PerformanceDataSeeder(db)
    metrics = new PerformanceMetrics()
    console.log('✓ Setup complete\n')

    await dataSeeder.seedAll({
      userCount: parseInt(process.env.PERF_USER_COUNT || '100000'),
      librariesPerUser: parseInt(process.env.PERF_LIBS_PER_USER || '10'),
      itemsPerLibrary: parseInt(process.env.PERF_ITEMS_PER_LIB || '10'),
      bookmarksPerUser: parseInt(process.env.PERF_BOOKMARKS_PER_USER || '100'),
      batchSize: parseInt(process.env.PERF_BATCH_SIZE || '10000'),
    })

    await db.execute(sql`ANALYZE`)
  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  }
})

beforeEach(async () => {
  if (metrics) {
    metrics.reset()
  }
})

afterEach(async () => {
  if (metrics) {
    console.log('\n' + metrics.generateReport())
  }
})
