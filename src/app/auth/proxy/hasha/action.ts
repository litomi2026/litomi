'use server'

import { db } from '@/database/drizzle'
import { bookmarkTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'
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

export interface ResponseHashaBookmark {
  data: Bookmark[]
  entireMangaCount: number
  maxPage: number
  msg: string
  nowPage: string
}

type ResponseHashaLogin = {
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

  if (!userId) {
    return { error: '로그인 후 시도해주세요.', formData }
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      referer: 'https://hasha.in',
      'User-Agent':
        // TODO: 랜덤화하기
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    }

    const loginResponse = await fetch('https://hasha.in/api/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify(validatedFields.data),
    })

    const loginResult = (await loginResponse.json()) as ResponseHashaLogin

    // TODO: 모든 페이지 가져오기, 실패 시 exponential backoff 적용하기
    const bookmarkResponse = await fetch('https://hasha.in/api/manga', {
      method: 'POST',
      headers: {
        ...headers,
        Authorization: `Bearer ${loginResult.token}`,
      },
      body: JSON.stringify({
        loadBookmarked: true,
        page: '1',
        sort: 'date',
        order: -1,
      }),
    })

    const bookmarkResult = (await bookmarkResponse.json()) as ResponseHashaBookmark
    const userIdNumber = +userId
    const bookmarkedMangaIds = bookmarkResult.data.map(({ mangaId }) => ({ userId: +userIdNumber, mangaId }))
    await db.insert(bookmarkTable).values(bookmarkedMangaIds).onConflictDoNothing()

    return { success: true }
  } catch (error) {
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
