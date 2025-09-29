import { desc, gte, lt, sum } from 'drizzle-orm'
import 'server-only'

import { redisClient } from '@/database/redis'
import { db } from '@/database/supabase/drizzle'
import { searchTrendsTable } from '@/database/supabase/search-trends-schema'
import { sec } from '@/utils/date'

export interface TrendingKeyword {
  keyword: string
  score: number
  searchCount?: number
}

class TrendingKeywordsService {
  private readonly DAILY_KEY = 'trending:daily'
  private readonly DAILY_WINDOW = sec('24 hours')
  private readonly HOURLY_KEY = 'trending:hourly'
  private readonly MAX_KEYWORD_LENGTH = 100
  private readonly TRENDING_KEY = 'trending:keywords'
  private readonly WINDOW_SIZE = sec('1 hour')

  async cleanupOldData(daysToKeep = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    try {
      await db.delete(searchTrendsTable).where(lt(searchTrendsTable.date, cutoffStr))
    } catch (error) {
      console.error('cleanupOldData:', error)
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

  async getTrendingHistorical(days = 7, limit = 30): Promise<TrendingKeyword[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      const trends = await db
        .select({
          keyword: searchTrendsTable.keyword,
          totalCount: sum(searchTrendsTable.searchCount),
        })
        .from(searchTrendsTable)
        .where(gte(searchTrendsTable.date, startDate.toISOString().split('T')[0]))
        .groupBy(searchTrendsTable.keyword)
        .orderBy(({ totalCount }) => desc(totalCount))
        .limit(limit)

      return trends.map((trend) => ({
        keyword: trend.keyword,
        score: Number(trend.totalCount),
        searchCount: Number(trend.totalCount),
      }))
    } catch (error) {
      console.error('getTrendingHistorical:', error)
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
    ]

    try {
      await redisClient
        .multi()
        .zunionstore(aggregateKey, keys.length, keys, { weights: [1, 0.6, 0.3] })
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

  async persistHourlyData(): Promise<void> {
    const currentWindow = Math.floor(Date.now() / 1000 / this.WINDOW_SIZE)
    const windowToProcess = currentWindow - 1
    const hourlyKey = `${this.HOURLY_KEY}:${windowToProcess}`

    try {
      const data = await redisClient.zrange<string[]>(hourlyKey, 0, -1, { withScores: true })

      if (!data || data.length === 0) {
        return
      }

      const records = []
      const processDate = new Date(windowToProcess * this.WINDOW_SIZE * 1000)
      const dateStr = processDate.toISOString().split('T')[0]
      const hour = processDate.getHours()

      for (let i = 0; i < data.length; i += 2) {
        records.push({
          keyword: data[i],
          searchCount: Number(data[i + 1]),
          date: dateStr,
          hour: hour,
        })
      }

      if (records.length > 0) {
        await db
          .insert(searchTrendsTable)
          .values(records)
          .onConflictDoUpdate({
            target: [searchTrendsTable.keyword, searchTrendsTable.date, searchTrendsTable.hour],
            set: { searchCount: searchTrendsTable.searchCount },
          })

        console.log(`Persisted ${records.length} search trends for hour ${hour} on ${dateStr}`)
      }
    } catch (error) {
      console.error('persistHourlyData:', error)
    }
  }

  async trackSearch(keyword: string): Promise<void> {
    if (!keyword || keyword.length > this.MAX_KEYWORD_LENGTH) {
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

  private normalizeKeyword(keyword: string): string {
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
