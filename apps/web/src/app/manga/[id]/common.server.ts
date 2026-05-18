import { litomiClient } from '@litomi/crawler/crawler/litomi'
import 'server-only'
import { cache } from 'react'

export const getManga = cache(async (id: number) => {
  try {
    return await litomiClient.getManga(id)
  } catch {
    return null
  }
})
