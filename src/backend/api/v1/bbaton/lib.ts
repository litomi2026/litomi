import 'server-only'
import { z } from 'zod'

import { env } from '@/env/server.hono'

const { BBATON_CLIENT_ID, BBATON_CLIENT_SECRET } = env

type Params = {
  code: string
  redirectURI: string
}

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
    gender: z.enum(['F', 'M']),
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
    console.error(
      'bbaton profile response invalid:',
      JSON.stringify(
        {
          issues: parsed.error.issues,
          payload: getProfileValidationDiagnostic(json, parsed.error.issues),
        },
        null,
        2,
      ),
    )
    throw new Error('BBATON_PROFILE_RESPONSE_INVALID')
  }

  return parsed.data
}

function getDiagnosticValue(value: unknown) {
  return {
    type: getValueType(value),
    value,
  }
}

function getProfileValidationDiagnostic(json: unknown, issues: readonly { path: readonly unknown[] }[]) {
  const payload = isRecord(json) ? json : null
  const invalidFields: Record<string, unknown> = {}

  if (payload) {
    for (const issue of issues) {
      const field = issue.path.length === 1 && typeof issue.path[0] === 'string' ? issue.path[0] : null
      if (!field || field === 'user_id') {
        continue
      }

      invalidFields[field] = getDiagnosticValue(payload[field])
    }
  }

  return {
    apiResult: payload
      ? {
          result_code: getDiagnosticValue(payload.result_code),
          result_message: getDiagnosticValue(payload.result_message),
        }
      : null,
    invalidFields,
    keys: payload ? Object.keys(payload) : [],
    payloadType: getValueType(json),
  }
}

function getValueType(value: unknown): string {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    return 'array'
  }

  return typeof value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
