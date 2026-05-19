import { env } from '@litomi/env/server.hono'
import { z } from 'zod'

const { BBATON_CLIENT_ID, BBATON_CLIENT_SECRET } = env

type Params = {
  code: string
  redirectURI: string
}

const bbatonGenderSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.enum(['f', 'female', 'm', 'male']))
  .transform(normalizeBBatonGender)

const tokenSchema = z
  .object({
    access_token: z.string().min(1),
    expires_in: z.number().int().positive(),
    scope: z.string().min(1),
    token_type: z.string().regex(/^bearer$/i),
  })
  .transform(({ access_token, expires_in, scope }) => ({
    accessToken: access_token,
    expiresIn: expires_in,
    scope,
    tokenType: 'Bearer' as const,
  }))

type ExchangedToken = z.infer<typeof tokenSchema>

const profileSchema = z
  .object({
    adult_flag: z.enum(['N', 'Y']),
    birth_year: z.string().regex(/^\d+$/),
    gender: bbatonGenderSchema,
    income: z.string().min(1),
    student: z.string().min(1),
    user_id: z.string().min(1),
  })
  .transform(({ adult_flag, birth_year, gender, income, student, user_id }) => ({
    adultFlag: adult_flag,
    birthYear: birth_year,
    gender,
    income,
    student,
    userId: user_id,
  }))

type BBatonProfile = z.infer<typeof profileSchema>

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
    throw new Error('BBATON_TOKEN_EXCHANGE_FAILED')
  }

  const parsed = tokenSchema.safeParse(json)
  if (!parsed.success) {
    console.error('bbaton token response invalid:', parsed.error)
    throw new Error('BBATON_TOKEN_RESPONSE_INVALID')
  }

  return parsed.data
}

export async function fetchBBatonProfile(accessToken: string, tokenType = 'Bearer'): Promise<BBatonProfile> {
  const response = await fetch('https://bapi.bbaton.com/v2/user/me', {
    method: 'GET',
    headers: { Authorization: `${tokenType} ${accessToken}` },
  })

  const json = await response.json().catch(() => null)

  if (!response.ok) {
    console.error('bbaton user profile request failed:', response.status, json)
    throw new Error('BBATON_PROFILE_REQUEST_FAILED')
  }

  const parsed = profileSchema.safeParse(json)
  if (!parsed.success) {
    console.error('bbaton profile response invalid:', parsed.error)
    throw new Error('BBATON_PROFILE_RESPONSE_INVALID')
  }

  return parsed.data
}

function normalizeBBatonGender(value: 'f' | 'female' | 'm' | 'male'): 'F' | 'M' {
  return value === 'f' || value === 'female' ? 'F' : 'M'
}
