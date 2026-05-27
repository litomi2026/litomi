#!/usr/bin/env bun

import { MANGA_RECOMMENDATION_ITEM_LIMIT } from '@litomi/domain/manga-recommendation/policy'

import { generateMangaRecommendationsForUser } from './generator'
import { selectActiveUserIds } from './query'

type GenerateArgs = {
  activeDays: number
  concurrency: number
  itemLimit: number
  maxUsers: number
  userId?: number
}

if (import.meta.main) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

function formatDurationMs(durationMs: number) {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`
  }

  return `${(durationMs / 1000).toFixed(2)}s`
}

async function generateMangaRecommendationsForUserWithTiming(userId: number, itemLimit: number) {
  const startedAt = performance.now()
  const items = await generateMangaRecommendationsForUser(userId, { itemLimit })

  return {
    durationMs: performance.now() - startedAt,
    items,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.userId) {
    const result = await generateMangaRecommendationsForUserWithTiming(args.userId, args.itemLimit)
    console.info(
      `generated ${result.items.length} manga recommendations for user ${args.userId} ` +
        `in ${formatDurationMs(result.durationMs)}`,
    )
    return
  }

  const userIds = await selectActiveUserIds({
    activeDays: args.activeDays,
    limit: args.maxUsers,
  })

  console.info(
    `generating manga recommendations for ${userIds.length} users ` +
      `(activeDays=${args.activeDays}, itemLimit=${args.itemLimit}, concurrency=${args.concurrency})`,
  )

  let processedUsers = 0
  let usersWithItems = 0
  let generatedItems = 0
  let failedUsers = 0

  await runWithConcurrency(userIds, args.concurrency, async (userId) => {
    try {
      const result = await generateMangaRecommendationsForUserWithTiming(userId, args.itemLimit)
      processedUsers++

      if (result.items.length > 0) {
        usersWithItems++
        generatedItems += result.items.length
      }

      console.info(
        `generated ${result.items.length} manga recommendations for user ${userId} ` +
          `in ${formatDurationMs(result.durationMs)}`,
      )
    } catch (error) {
      failedUsers++
      console.error(`failed to generate manga recommendations for user ${userId}:`, error)
    }
  })

  console.info(
    `generated ${generatedItems} manga recommendations for ${usersWithItems}/${processedUsers} processed users ` +
      `(selectedUsers=${userIds.length}, failedUsers=${failedUsers})`,
  )

  if (failedUsers > 0) {
    throw new Error(`failed to generate manga recommendations for ${failedUsers} users`)
  }
}

function parseArgs(argv: string[]): GenerateArgs {
  const args: GenerateArgs = {
    activeDays: 30,
    concurrency: 2,
    itemLimit: MANGA_RECOMMENDATION_ITEM_LIMIT,
    maxUsers: 5000,
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
      case 'active-days':
        args.activeDays = parsePositiveInteger(key, value)
        break
      case 'concurrency':
        args.concurrency = parsePositiveInteger(key, value)
        break
      case 'item-limit':
        args.itemLimit = parsePositiveInteger(key, value)
        break
      case 'max-users':
        args.maxUsers = parsePositiveInteger(key, value)
        break
      case 'user-id':
        args.userId = parsePositiveInteger(key, value)
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
