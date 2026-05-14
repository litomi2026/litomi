import { z } from 'zod'

export const getSearchSuggestionsResponseSchema = z.array(
  z.object({
    label: z.string(),
    value: z.string(),
  }),
)

export type GETSearchSuggestionsResponse = z.infer<typeof getSearchSuggestionsResponseSchema>

export const getTrendingKeywordsResponseSchema = z.object({
  keywords: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    }),
  ),
  updatedAt: z.date(),
})

export type GETTrendingKeywordsResponse = z.infer<typeof getTrendingKeywordsResponseSchema>
