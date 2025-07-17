import { z } from 'zod/v4'

export enum SearchSuggestionsLocale {
  KO = 'ko',
  EN = 'en',
  JA = 'ja',
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
}

export const GETSearchSuggestionsSchema = z.object({
  query: z.string().trim().min(2).max(200),
  locale: z.enum(SearchSuggestionsLocale).default(SearchSuggestionsLocale.KO),
})

export type GETSearchSuggestionsRequest = z.infer<typeof GETSearchSuggestionsSchema>

export type GETSearchSuggestionsResponse = {
  label: string
  value: string
}[]

export const queryBlacklist = [/^id:/]
