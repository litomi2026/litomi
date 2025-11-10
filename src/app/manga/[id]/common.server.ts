import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import 'server-only'

import { litomiClient } from '@/crawler/litomi'

const getMangaFromNextjsCache = (id: number) =>
  unstable_cache(
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

export const getManga = cache((id: number) => getMangaFromNextjsCache(id))
