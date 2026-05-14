import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import 'server-only'

import { litomiClient } from '@/crawler/litomi'

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
