import { z } from 'zod/v4'

import { Locale } from '@/translation/common'

export const GETSearchSuggestionsSchema = z.object({
  query: z.string().trim().min(2).max(200),
  locale: z.enum(Locale).optional(),
})

export type GETSearchSuggestionsRequest = z.infer<typeof GETSearchSuggestionsSchema>

export type GETSearchSuggestionsResponse = {
  label: string
  value: string
}[]

export const queryBlacklist = [/^id:/]
