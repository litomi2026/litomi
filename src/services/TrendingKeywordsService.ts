import { desc, gte, lt, sum } from 'drizzle-orm'
import 'server-only'

import { redisClient } from '@/database/redis'
import { db } from '@/database/supabase/drizzle'
import { searchTrendsTable } from '@/database/supabase/search-trends-schema'

import { TrendingKeyword, TrendingKeywordsRedisService } from './TrendingKeywordsRedisService'

export { type TrendingKeyword } from './TrendingKeywordsRedisService'

/**
 * Full trending keywords service with both Redis and Postgres operations
 * For Node.js runtime only (not edge runtime compatible)
 */
class TrendingKeywordsService extends TrendingKeywordsRedisService {
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
}

// Singleton instance
export const trendingKeywordsService = new TrendingKeywordsService()
