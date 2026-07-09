import { MANGA_RECOMMENDATION_ITEM_LIMIT } from '@litomi/domain/manga-recommendation/policy'

import { type FlagValues, parseFlags, parsePositiveInteger, parseRatio } from './cli'
import { generateMangaRecommendationsForUser } from './generator'
import { log } from './log'
import { selectActiveUserIds } from './query'

type GenerateArgs = {
  activeDays: number
  concurrency: number
  itemLimit: number
  maxFailureRatio: number
  maxUsers: number
  userId?: number
}

const FLAG_KEYS = ['active-days', 'concurrency', 'item-limit', 'max-failure-ratio', 'max-users', 'user-id'] as const

export async function runGenerate(argv: string[]) {
  const args = parseArgs(argv)

  if (args.userId !== undefined) {
    const startedAt = performance.now()
    const items = await generateMangaRecommendationsForUser(args.userId, { itemLimit: args.itemLimit })

    log.info('generated manga recommendations for user', {
      durationSeconds: durationSeconds(startedAt),
      itemCount: items.length,
      userId: args.userId,
    })

    return
  }

  const startedAt = performance.now()

  const userIds = await selectActiveUserIds({
    activeDays: args.activeDays,
    limit: args.maxUsers,
  })

  log.info('selected active users for recommendation generation', {
    activeDays: args.activeDays,
    concurrency: args.concurrency,
    itemLimit: args.itemLimit,
    selectedUsers: userIds.length,
  })

  let processedUsers = 0
  let usersWithItems = 0
  let generatedItems = 0
  let failedUsers = 0

  await runWithConcurrency(userIds, args.concurrency, async (userId) => {
    try {
      const items = await generateMangaRecommendationsForUser(userId, { itemLimit: args.itemLimit })
      processedUsers++

      if (items.length > 0) {
        usersWithItems++
        generatedItems += items.length
      }
    } catch (error) {
      failedUsers++
      log.error('failed to generate manga recommendations for user', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      })
    }
  })

  const failureRatio = userIds.length === 0 ? 0 : failedUsers / userIds.length

  log.info('recommendation generation completed', {
    metrics: {
      durationSeconds: durationSeconds(startedAt),
      failedUsers,
      failureRatio: Number(failureRatio.toFixed(4)),
      generatedItems,
      processedUsers,
      selectedUsers: userIds.length,
      usersWithItems,
    },
  })

  if (failedUsers > 0 && failureRatio > args.maxFailureRatio) {
    throw new Error(
      `failure ratio ${(failureRatio * 100).toFixed(1)}% exceeded threshold ${(args.maxFailureRatio * 100).toFixed(1)}% ` +
        `(${failedUsers}/${userIds.length} users failed)`,
    )
  }
}

function durationSeconds(startedAt: number) {
  return Number(((performance.now() - startedAt) / 1000).toFixed(2))
}

function parseArgs(argv: string[]): GenerateArgs {
  const flags = parseFlags(argv, FLAG_KEYS)

  return {
    activeDays: integerFlag(flags, 'active-days', 30),
    concurrency: integerFlag(flags, 'concurrency', 2),
    itemLimit: integerFlag(flags, 'item-limit', MANGA_RECOMMENDATION_ITEM_LIMIT),
    maxFailureRatio: ratioFlag(flags, 'max-failure-ratio', 0.05),
    maxUsers: integerFlag(flags, 'max-users', 5000),
    userId: flags.has('user-id') ? parsePositiveInteger('user-id', flags.get('user-id')!) : undefined,
  }
}

function integerFlag(flags: FlagValues, key: string, fallback: number) {
  const value = flags.get(key)
  return value === undefined ? fallback : parsePositiveInteger(key, value)
}

function ratioFlag(flags: FlagValues, key: string, fallback: number) {
  const value = flags.get(key)
  return value === undefined ? fallback : parseRatio(key, value)
}

async function runWithConcurrency<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>) {
  let nextIndex = 0

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex++]

        if (item !== undefined) {
          await task(item)
        }
      }
    }),
  )
}
