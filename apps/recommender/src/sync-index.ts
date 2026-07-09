import { parseFlags, parsePositiveInteger } from './cli'
import { log } from './log'
import { syncMangaSearchIndex } from './opensearch'

const FLAG_KEYS = ['batch-size'] as const

export async function runSyncIndex(argv: string[]) {
  const flags = parseFlags(argv, FLAG_KEYS)
  const batchSize = flags.has('batch-size') ? parsePositiveInteger('batch-size', flags.get('batch-size')!) : 1_000
  const startedAt = performance.now()

  const result = await syncMangaSearchIndex({ batchSize })

  log.info('synced manga records into OpenSearch index', {
    metrics: {
      durationSeconds: Number(((performance.now() - startedAt) / 1000).toFixed(2)),
      indexName: result.indexName,
      total: result.total,
    },
  })
}
