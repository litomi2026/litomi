import { redis } from '@litomi/db/redis'
import { sec } from '@litomi/std'

export interface TrendingKeyword {
  keyword: string
  score: number
  searchCount?: number
}

class TrendingKeywordsService {
  protected readonly AGGREGATE_CACHE_WINDOW = sec('1 minute')
  protected readonly DAILY_KEY = 'trending:daily'
  protected readonly DAILY_WINDOW = sec('24 hours')
  protected readonly HOURLY_AGGREGATION_WINDOW = 5
  protected readonly HOURLY_KEY = 'trending:hourly'
  protected readonly HOURLY_WINDOW = sec('1 hour')
  protected readonly TRENDING_KEY = 'trending:keywords'

  async getTrendingDaily(limit = 20): Promise<TrendingKeyword[]> {
    const currentDay = Math.floor(Date.now() / 1000 / this.DAILY_WINDOW)
    const dailyKey = `${this.DAILY_KEY}:${currentDay}`

    try {
      const trending = await redis.zrange(dailyKey, limit * -1, -1, 'REV', 'WITHSCORES')
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
    const aggregateKey = this.getHourlyAggregateKey(hourWindow)

    try {
      const exists = await redis.exists(aggregateKey)

      if (!exists) {
        const aggregations = Array.from({ length: this.HOURLY_AGGREGATION_WINDOW })
        const keys = aggregations.map((_, i) => `${this.HOURLY_KEY}:${hourWindow - i}`)
        const weights = aggregations.map((_, i) => 1 / (i + 1))
        await redis.zunionstore(aggregateKey, keys.length, ...keys, 'WEIGHTS', ...weights)
        await redis.expire(aggregateKey, this.AGGREGATE_CACHE_WINDOW)
      }

      const trending = await redis.zrange(aggregateKey, limit * -1, -1, 'REV', 'WITHSCORES')
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
    const normalizedKeyword = this.normalizeKeyword(keyword)
    if (!normalizedKeyword) {
      return
    }

    const timestamp = Date.now()
    const hourWindow = Math.floor(timestamp / 1000 / this.HOURLY_WINDOW)
    const dayWindow = Math.floor(timestamp / 1000 / this.DAILY_WINDOW)
    const hourlyKey = `${this.HOURLY_KEY}:${hourWindow}`
    const dailyKey = `${this.DAILY_KEY}:${dayWindow}`

    try {
      const pipeline = redis.pipeline()

      pipeline.zincrby(hourlyKey, 1, normalizedKeyword)
      pipeline.zincrby(dailyKey, 1, normalizedKeyword)
      pipeline.expire(hourlyKey, this.HOURLY_WINDOW * (this.HOURLY_AGGREGATION_WINDOW + 1))
      pipeline.expire(dailyKey, this.DAILY_WINDOW * 2)
      pipeline.del(this.getHourlyAggregateKey(hourWindow))

      await pipeline.exec()
    } catch (error) {
      console.error('trackSearch:', error)
    }
  }

  protected getHourlyAggregateKey(hourWindow: number): string {
    return `${this.TRENDING_KEY}:aggregate:v2:${hourWindow}`
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

export const trendingKeywordsService = new TrendingKeywordsService()
