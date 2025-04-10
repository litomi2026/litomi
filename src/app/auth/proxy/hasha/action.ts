'use server'

import { db } from '@/database/drizzle'
import { bookmarkTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { retryWithExponentialBackoff } from '@/utils/retry'
import { captureException } from '@sentry/nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const schema = z.object({
  username: z.string(),
  pwd: z.string(),
})

export interface Bookmark {
  _id: string
  artists: string[]
  bookmarkedCount: number
  characters: string[]
  commentCount: number
  date: string
  dislikes: number
  filesHost: string
  filesPath: string
  group: string[]
  images: Image[]
  likes: number
  mangaId: number
  pages: number
  related: number[]
  series: string[]
  tags: string[]
  title: string
  type: string
  viewData: string[]
  views: number
}

export interface Image {
  hasavif: number
  hasjxl?: number
  haswebp?: number
  height: number
  name: string
  single?: number
  width: number
}

export type ResponseHashaBookmark =
  | { code: number; msg: string }
  | {
      data: Bookmark[]
      entireMangaCount: number
      maxPage: number
      msg: string
      nowPage: string
    }

type ResponseHashaLogin =
  | { code: number; msg: string }
  | {
      msg: string
      token: string
    }

export default async function hashaLogin(_prevState: unknown, formData: FormData) {
  const validatedFields = schema.safeParse({
    username: formData.get('username'),
    pwd: formData.get('pwd'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      formData,
    }
  }

  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)
  if (!userId) return { status: 401, error: '로그인 정보가 없거나 만료됐어요.', formData }

  try {
    const randomNumber = (Math.random() * 30).toFixed(0).padStart(2, '0')
    const headers = {
      'Content-Type': 'application/json',
      referer: 'https://hasha.in',
      'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/1${randomNumber}.0.0.0 Safari/537.36`,
    }

    const loginResponse = await retryWithExponentialBackoff(() =>
      fetch('https://hasha.in/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify(validatedFields.data),
      }),
    )

    const loginResult = (await loginResponse.json()) as ResponseHashaLogin
    if (!('token' in loginResult)) return { error: loginResult.msg, formData }

    const bookmarkHeaders = { ...headers, Authorization: `Bearer ${loginResult.token}` }
    const bookmarkResponse = await retryWithExponentialBackoff(
      () =>
        fetch('https://hasha.in/api/manga', {
          method: 'POST',
          headers: bookmarkHeaders,
          body: JSON.stringify({ loadBookmarked: true, page: 1 }),
        }),
      { maxRetries: 8 },
    )

    const bookmarkResult = (await bookmarkResponse.json()) as ResponseHashaBookmark
    if (!('data' in bookmarkResult)) return { error: bookmarkResult.msg, formData }

    const bookmarkIds = bookmarkResult.data.map(({ mangaId }) => mangaId)
    // TODO: 모든 북마크를 가져오기 위해 maxPage를 사용하여 반복문 돌리기
    // const maxPage = bookmarkResult.maxPage
    const userIdNumber = +userId
    const bookmarkedMangaIds = bookmarkIds.map((mangaId) => ({ userId: userIdNumber, mangaId }))
    await db.insert(bookmarkTable).values(bookmarkedMangaIds).onConflictDoNothing()

    return { success: true, message: '북마크를 불러왔어요.' }
  } catch (error) {
    captureException(error, { extra: { name: 'hasha.in 로그인' } })

    if (error instanceof Error) {
      return { error: error.message, formData }
    } else if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
      return { error: error.message, formData }
    } else if (typeof error === 'string') {
      return { error, formData }
    } else {
      return { error: '북마크를 불러오는 도중 오류가 발생했어요.', formData }
    }
  }
}
