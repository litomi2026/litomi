import 'server-only'

import { redisClient } from '@/database/redis'
import { sec } from '@/utils/date'

export interface TrendingKeyword {
  keyword: string
  score: number
  searchCount?: number
}

/**
 * Redis-only trending keywords service for edge runtime compatibility
 */
export class TrendingKeywordsRedisService {
  protected readonly DAILY_KEY = 'trending:daily'
  protected readonly DAILY_WINDOW = sec('24 hours')
  protected readonly HOURLY_KEY = 'trending:hourly'
  protected readonly MAX_KEYWORD_LENGTH = 100
  protected readonly TRENDING_KEY = 'trending:keywords'
  protected readonly WINDOW_SIZE = sec('1 hour')

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

  async getTrendingRealtime(limit = 10): Promise<TrendingKeyword[]> {
    const currentWindow = Math.floor(Date.now() / 1000 / this.WINDOW_SIZE)
    const aggregateKey = `${this.TRENDING_KEY}:aggregate:${currentWindow}`

    const keys = [
      `${this.HOURLY_KEY}:${currentWindow}`,
      `${this.HOURLY_KEY}:${currentWindow - 1}`,
      `${this.HOURLY_KEY}:${currentWindow - 2}`,
      `${this.HOURLY_KEY}:${currentWindow - 3}`,
      `${this.HOURLY_KEY}:${currentWindow - 4}`,
    ]

    try {
      await redisClient
        .multi()
        .zunionstore(aggregateKey, keys.length, keys, { weights: [1, 0.7, 0.4, 0.2, 0.1] })
        .expire(aggregateKey, sec('5 minutes'))
        .exec()

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
    const timestamp = Date.now()
    const currentWindow = Math.floor(timestamp / 1000 / this.WINDOW_SIZE)
    const dayWindow = Math.floor(timestamp / 1000 / this.DAILY_WINDOW)
    const hourlyKey = `${this.HOURLY_KEY}:${currentWindow}`
    const dailyKey = `${this.DAILY_KEY}:${dayWindow}`

    try {
      await redisClient
        .multi()
        .zincrby(hourlyKey, 1, normalizedKeyword)
        .expire(hourlyKey, this.WINDOW_SIZE * 3)
        .zincrby(dailyKey, 1, normalizedKeyword)
        .expire(dailyKey, this.DAILY_WINDOW * 2)
        .exec()
    } catch (error) {
      console.error('trackSearch:', error)
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

// Singleton instance for edge runtime
export const trendingKeywordsRedisService = new TrendingKeywordsRedisService()
