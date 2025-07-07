import { KHentaiClient } from '@/crawler/k-hentai'
import { createHealthCheckHandler } from '@/crawler/proxy-utils'

export const runtime = 'edge'
export const revalidate = 10

export async function GET() {
  return createHealthCheckHandler('k', {
    search: async () => Array.isArray(await KHentaiClient.getInstance().searchMangas({ search: 'qwerpoiuasdflkj' })),
    images: async () => Array.isArray((await KHentaiClient.getInstance().fetchManga(3291051)).images), // 인기순 1위 망가
  })
}
