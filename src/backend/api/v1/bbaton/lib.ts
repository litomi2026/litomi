import { HTTPException } from 'hono/http-exception'
import 'server-only'
import { z } from 'zod'

import { env } from '@/env/server.hono'

const { BBATON_CLIENT_ID, BBATON_CLIENT_SECRET } = env

type BBatonProfile = {
  userId: string
  adultFlag: 'N' | 'Y'
  birthYear: string
  gender: 'F' | 'M'
  income: string
  student: string
}

type ExchangedToken = {
  accessToken: string
}

type Params = {
  code: string
  redirectURI: string
}

const tokenSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().min(1),
})

export async function exchangeAuthorizationCode({ code, redirectURI }: Params): Promise<ExchangedToken> {
  const url = 'https://bauth.bbaton.com/oauth/token'
  const auth = Buffer.from(`${BBATON_CLIENT_ID}:${BBATON_CLIENT_SECRET}`).toString('base64')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      redirect_uri: redirectURI,
      code,
    }),
  })

  const json = await response.json().catch(() => null)

  if (!response.ok) {
    console.error('bbaton token exchange failed:', response.status, json)
    throw new HTTPException(502, { message: '인증에 실패했어요. 다시 시도해 주세요.' })
  }

  const parsed = tokenSchema.safeParse(json)
  if (!parsed.success) {
    console.error('bbaton token response invalid:', parsed.error)
    throw new HTTPException(502, { message: '인증에 실패했어요. 다시 시도해 주세요.' })
  }

  return { accessToken: parsed.data.access_token }
}

const schema = z.object({
  user_id: z.string().min(1),
  adult_flag: z.enum(['N', 'Y']),
  birth_year: z.string().min(1).max(16),
  gender: z.enum(['F', 'M']),
  income: z.string().default('N/A'),
  student: z.string().default('N/A'),
})

export async function fetchBBatonProfile(accessToken: string): Promise<BBatonProfile> {
  const response = await fetch('https://bapi.bbaton.com/v2/user/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const json = await response.json().catch(() => null)

  if (!response.ok) {
    console.error('bbaton user profile request failed:', response.status, json)
    throw new HTTPException(502, { message: '인증에 실패했어요. 다시 시도해 주세요.' })
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    console.error('bbaton profile response invalid:', parsed.error)
    throw new HTTPException(502, { message: '인증에 실패했어요. 다시 시도해 주세요.' })
  }

  const { user_id, adult_flag, birth_year, gender, income, student } = parsed.data

  return {
    userId: user_id,
    adultFlag: adult_flag,
    birthYear: birth_year,
    gender,
    income,
    student,
  }
}
