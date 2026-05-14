import { litomiClient } from '@litomi/crawler/crawler/litomi'
import { unstable_cache } from 'next/cache'
import 'server-only'
import { cache } from 'react'

function getMangaFromNextjsCache(id: number) {
  return unstable_cache(
    async (id: number) => {
      try {
        return await litomiClient.getManga(id)
      } catch {
        return null
      }
    },
    ['manga'],
    { tags: ['manga', 'litomi', `manga:${id}`] },
  )(id)
}

export const getManga = cache(getMangaFromNextjsCache)
