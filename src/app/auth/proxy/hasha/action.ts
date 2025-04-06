'use server'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/utils/cookie'
import { compare } from 'bcrypt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod'

const schema = z.object({
  username: z
    .string()
    .min(2, { message: '아이디는 최소 2자 이상이어야 합니다.' })
    .max(32, { message: '아이디는 최대 32자까지 입력할 수 있습니다.' })
    .regex(/^[a-zA-Z][a-zA-Z0-9-._~]+$/, { message: '아이디는 알파벳, 숫자 - . _ ~ 로만 구성해야 합니다.' }),
  pwd: z
    .string()
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
    .max(64, { message: '비밀번호는 최대 64자까지 입력할 수 있습니다.' }),
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
    remember: formData.get('remember'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      formData,
    }
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      referer: 'https://hasha.in',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    }

    const loginResponse = await fetch('https://hasha.in/api/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify(validatedFields.data),
    })

    // 외부 API의 응답 텍스트를 가져옵니다.
    const loginResult = (await loginResponse.json()) as ResponseHashaLogin

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

    // 외부 API의 응답 텍스트를 가져옵니다.
    const bookmarkResult = (await bookmarkResponse.json()) as ResponseHashaBookmark

    return { success: true, bookmarkResult }
  } catch (error) {
    return { error, formData }
  }
}
