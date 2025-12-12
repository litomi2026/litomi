import 'server-only'
import { z } from 'zod'

import { TOONKOR_DOMAIN_PATTERN, toonkorClient, type ToonkorParams } from '@/crawler/toonkor/toonkor'
import { WebtoonCrawler, WebtoonEpisode, WebtoonList, WebtoonSeries } from '@/crawler/webtoon/types'
import { sec } from '@/utils/date'

/**
 * Webtoon Provider 설정
 */
type WebtoonProviderConfig<TParams> = {
  /** 크롤러 인스턴스 */
  crawler: WebtoonCrawler<TParams>
  /** 요청 파라미터 검증 스키마 */
  schema: z.ZodSchema<TParams>
  /** 에피소드 캐시 revalidate 시간 (초) */
  revalidate: number
  /** 시리즈 캐시 revalidate 시간 (초) */
  seriesRevalidate: number
  /** 목록 캐시 revalidate 시간 (초) */
  listRevalidate: number
}

/**
 * Provider 정의
 */
const toonkorProvider: WebtoonProviderConfig<ToonkorParams> = {
  crawler: toonkorClient,
  schema: z.object({
    domain: z
      .string()
      .min(1)
      .refine((d) => TOONKOR_DOMAIN_PATTERN.test(d), {
        message: '허용되지 않은 도메인이에요.',
      }),
    path: z.string().min(1),
  }),
  revalidate: sec('30 days'),
  seriesRevalidate: sec('1 hour'),
  listRevalidate: sec('1 day'),
}

// 향후 추가될 provider들
// const newtokiProvider: WebtoonProviderConfig<NewtokiParams> = { ... }
// const manatokiProvider: WebtoonProviderConfig<ManatokiParams> = { ... }

export const webtoonProviders = {
  toonkor: toonkorProvider,
  // newtoki: newtokiProvider,
  // manatoki: manatokiProvider,
} as const

export type WebtoonProviderName = keyof typeof webtoonProviders

export async function fetchWebtoonEpisode(
  providerName: WebtoonProviderName,
  searchParams: URLSearchParams,
): Promise<WebtoonEpisode> {
  const provider = webtoonProviders[providerName]
  const params = Object.fromEntries(searchParams.entries())

  // 스키마 검증
  const validation = provider.schema.safeParse(params)
  if (!validation.success) {
    throw new Error(validation.error.message || '잘못된 요청이에요.')
  }

  // 크롤러 호출
  const paramsWithRevalidate = { ...validation.data, revalidate: provider.revalidate }
  return provider.crawler.fetchEpisode(paramsWithRevalidate)
}

const listSchema = z.object({
  domain: z
    .string()
    .min(1)
    .refine((d) => TOONKOR_DOMAIN_PATTERN.test(d), {
      message: '허용되지 않은 도메인이에요.',
    }),
})

export async function fetchWebtoonList(
  providerName: WebtoonProviderName,
  searchParams: URLSearchParams,
): Promise<WebtoonList> {
  const provider = webtoonProviders[providerName]
  const params = Object.fromEntries(searchParams.entries())

  // 스키마 검증 (domain만 필요)
  const validation = listSchema.safeParse(params)
  if (!validation.success) {
    throw new Error(validation.error.message || '잘못된 요청이에요.')
  }

  // 크롤러 호출 (path는 크롤러 내부에서 고정)
  const paramsWithRevalidate = { ...validation.data, path: '', revalidate: provider.listRevalidate }
  return provider.crawler.fetchList(paramsWithRevalidate)
}

export async function fetchWebtoonSeries(
  providerName: WebtoonProviderName,
  searchParams: URLSearchParams,
): Promise<WebtoonSeries> {
  const provider = webtoonProviders[providerName]
  const params = Object.fromEntries(searchParams.entries())

  // 스키마 검증
  const validation = provider.schema.safeParse(params)
  if (!validation.success) {
    throw new Error(validation.error.message || '잘못된 요청이에요.')
  }

  // 크롤러 호출
  const paramsWithRevalidate = { ...validation.data, revalidate: provider.seriesRevalidate }
  return provider.crawler.fetchSeries(paramsWithRevalidate)
}

export function isValidProvider(name: string): name is WebtoonProviderName {
  return name in webtoonProviders
}
