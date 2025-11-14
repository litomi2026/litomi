import ms from 'ms'
import 'server-only'

import { redisClient } from '@/database/redis'
import { sec } from '@/utils/date'

export interface TrendingKeyword {
  keyword: string
  score: number
  searchCount?: number
}

/**
 * Trending keywords service with both Redis and Postgres operations
 */
class TrendingKeywordsService {
  protected readonly BATCH_INTERVAL = ms('1 minute')
  protected readonly BATCH_SIZE = 100
  protected batchTimer: NodeJS.Timeout | null = null
  protected readonly DAILY_KEY = 'trending:daily'
  protected readonly DAILY_WINDOW = sec('24 hours')
  protected readonly HOURLY_AGGREGATION_WINDOW = 5
  protected readonly HOURLY_KEY = 'trending:hourly'
  protected readonly HOURLY_WINDOW = sec('1 hour')
  protected searchBatch: Map<string, { keyword: string; count: number }> = new Map()
  protected readonly TRENDING_KEY = 'trending:keywords'

  async flushSearchBatch(): Promise<void> {
    if (this.searchBatch.size === 0) {
      return
    }

    const timestamp = Date.now()
    const hourWindow = Math.floor(timestamp / 1000 / this.HOURLY_WINDOW)
    const dayWindow = Math.floor(timestamp / 1000 / this.DAILY_WINDOW)
    const hourlyKey = `${this.HOURLY_KEY}:${hourWindow}`
    const dailyKey = `${this.DAILY_KEY}:${dayWindow}`

    try {
      const pipeline = redisClient.pipeline()

      for (const { keyword, count } of this.searchBatch.values()) {
        pipeline.zincrby(hourlyKey, count, keyword)
        pipeline.zincrby(dailyKey, count, keyword)
      }

      await pipeline.exec()
    } catch (error) {
      console.error('flushSearchBatch:', error)
    } finally {
      this.searchBatch.clear()

      if (this.batchTimer) {
        clearTimeout(this.batchTimer)
        this.batchTimer = null
      }
    }
  }

  async getTrendingDaily(limit = 20): Promise<TrendingKeyword[]> {
    const currentDay = Math.floor(Date.now() / 1000 / this.DAILY_WINDOW)
    const dailyKey = `${this.DAILY_KEY}:${currentDay}`

    try {
      const trending = await redisClient.zrange<string[]>(dailyKey, limit * -1, -1, { rev: true, withScores: true })
      const results: TrendingKeyword[] = []

      for (let i = 0; i < trending.length; i += 2) {
        results.push({
          keyword: trending[i],
          score: Number(trending[i + 1]),
        })
      }

      return results
    } catch (error) {
      console.error('getTrendingDaily:', error)
      return []
    }
  }

  async getTrendingHourly(limit = 10): Promise<TrendingKeyword[]> {
    const hourWindow = Math.floor(Date.now() / 1000 / this.HOURLY_WINDOW)
    const aggregateKey = `${this.TRENDING_KEY}:aggregate:${hourWindow}`

    try {
      const exists = await redisClient.exists(aggregateKey)

      if (!exists) {
        const aggregations = Array.from({ length: this.HOURLY_AGGREGATION_WINDOW })
        const keys = aggregations.map((_, i) => `${this.HOURLY_KEY}:${hourWindow - i}`)
        const weights = aggregations.map((_, i) => 1 - i / aggregations.length)
        await redisClient.zunionstore(aggregateKey, keys.length, keys, { weights })
      }

      const trending = await redisClient.zrange<string[]>(aggregateKey, limit * -1, -1, { rev: true, withScores: true })
      const results: TrendingKeyword[] = []

      for (let i = 0; i < trending.length; i += 2) {
        results.push({
          keyword: trending[i],
          score: Number(trending[i + 1]),
        })
      }

      return results
    } catch (error) {
      console.error('getTrendingRealtime:', error)
      return []
    }
  }

  async trackSearch(keyword: string): Promise<void> {
    if (!keyword) {
      return
    }

    const normalizedKeyword = this.normalizeKeyword(keyword)
    const existing = this.searchBatch.get(normalizedKeyword)

    if (existing) {
      existing.count++
    } else {
      this.searchBatch.set(normalizedKeyword, { keyword: normalizedKeyword, count: 1 })
    }

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushSearchBatch(), this.BATCH_INTERVAL)
    }

    if (this.searchBatch.size >= this.BATCH_SIZE) {
      await this.flushSearchBatch()
    }
  }

  protected normalizeKeyword(keyword: string): string {
    const parts = keyword
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0)

    const categorizedTags: string[] = []
    const normalText: string[] = []

    for (const part of parts) {
      if (part.includes(':')) {
        categorizedTags.push(part)
      } else {
        normalText.push(part)
      }
    }

    categorizedTags.sort((a, b) => a.localeCompare(b))
    return [...normalText, ...categorizedTags].join(' ')
  }
}

// Singleton instance
export const trendingKeywordsService = new TrendingKeywordsService()

// Ensure batch is flushed on process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => trendingKeywordsService.flushSearchBatch())
  process.on('SIGINT', () => trendingKeywordsService.flushSearchBatch())
}
