import { z } from 'zod/v4'

export const GETSearchSuggestionsSchema = z.object({
  query: z.string().trim().min(2).max(200),
  locale: z.enum(['ko', 'en', 'ja', 'zh-CN', 'zh-TW']).default('ko'),
})

export type GETSearchSuggestionsRequest = z.infer<typeof GETSearchSuggestionsSchema>

export type GETSearchSuggestionsResponse = {
  label: string
  value: string
}[]

export const queryBlacklist = [/^id:/]
