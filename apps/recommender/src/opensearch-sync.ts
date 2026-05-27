#!/usr/bin/env bun

import { syncMangaSearchIndex } from './opensearch'

type SyncArgs = {
  batchSize: number
}

if (import.meta.main) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const startedAt = performance.now()
  const result = await syncMangaSearchIndex({ batchSize: args.batchSize })
  const durationSeconds = ((performance.now() - startedAt) / 1000).toFixed(2)

  console.info(`synced ${result.total} manga records into OpenSearch index ${result.indexName} in ${durationSeconds}s`)
}

function parseArgs(argv: string[]): SyncArgs {
  const args: SyncArgs = {
    batchSize: 1_000,
  }

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]

    if (!arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`)
    }

    const [key, inlineValue] = arg.slice(2).split('=', 2)
    const value = inlineValue ?? argv[++index]

    if (!value) {
      throw new Error(`Missing value for --${key}`)
    }

    switch (key) {
      case 'batch-size':
        args.batchSize = parsePositiveInteger(key, value)
        break
      default:
        throw new Error(`Unknown option: --${key}`)
    }
  }

  return args
}

function parsePositiveInteger(name: string, value: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${name} must be a positive integer`)
  }

  return parsed
}
