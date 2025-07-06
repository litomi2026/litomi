import { captureException } from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

import { SearchParamsSchema } from '@/app/(navigation)/search/searchValidation'

export const runtime = 'edge'
export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = Object.fromEntries(searchParams.entries())
    const validationResult = SearchParamsSchema.safeParse(params)

    if (!validationResult.success) {
      return new Response('400 Bad Request', { status: 400 })
    }

    const kHentaiUrl = new URL('https://k-hentai.org/ajax/search')

    Object.entries(validationResult.data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        kHentaiUrl.searchParams.append(key, String(value))
      }
    })

    const response = await fetch(kHentaiUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: 'https://k-hentai.org/',
      },
      redirect: 'manual',
    })

    if (!response.ok) {
      captureException(new Error(`K-Hentai API returned ${response.status}`), {
        tags: {
          api: 'k-hentai',
          status: response.status,
        },
        extra: {
          searchParams: validationResult.data,
          url: kHentaiUrl.toString(),
          statusText: response.statusText,
        },
      })

      return NextResponse.json(
        { error: `k-hentai.org returned status ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    captureException(error, {
      tags: {
        api: 'k-hentai',
        type: 'proxy_error',
      },
      extra: {
        searchParams: Object.fromEntries(request.nextUrl.searchParams),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json({ error: 'Network error accessing k-hentai.org' }, { status: 503 })
    }

    return NextResponse.json({ error: 'Failed to fetch from k-hentai.org' }, { status: 500 })
  }
}
