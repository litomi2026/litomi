import type {
  POSTV1AuthLogin2FARequest,
  POSTV1AuthLogin2FAResponse,
  POSTV1AuthLoginRequest,
  POSTV1AuthLoginResponse,
  POSTV1AuthPasskeyOptionsResponse,
  POSTV1AuthPasskeyVerifyRequest,
  POSTV1AuthPasskeyVerifyResponse,
} from '@litomi/contracts/api/auth'
import type {
  POSTV1LibraryHistoryImportBody,
  POSTV1LibraryHistoryImportResponse,
} from '@litomi/contracts/api/library'

import { env } from '@litomi/env/env/client'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function importReadingHistory(request: POSTV1LibraryHistoryImportBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library/history/import`

  const { data } = await fetchWithErrorHandling<POSTV1LibraryHistoryImportResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function login(request: POSTV1AuthLoginRequest) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/auth/login`

  const { data } = await fetchWithErrorHandling<POSTV1AuthLoginResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function requestPasskeyAuthenticationOptions() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/auth/passkey/options`

  const { data } = await fetchWithErrorHandling<POSTV1AuthPasskeyOptionsResponse>(url, {
    method: 'POST',
    credentials: 'include',
  })

  return data
}

export async function verifyPasskeyAuthentication(request: POSTV1AuthPasskeyVerifyRequest) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/auth/passkey/verify`

  const { data } = await fetchWithErrorHandling<POSTV1AuthPasskeyVerifyResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function verifyTwoFactorLogin(request: POSTV1AuthLogin2FARequest) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/auth/login/2fa`

  const { data } = await fetchWithErrorHandling<POSTV1AuthLogin2FAResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
