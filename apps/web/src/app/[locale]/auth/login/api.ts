import type {
  POSTV1AuthLogin2FARequest,
  POSTV1AuthLogin2FAResponse,
  POSTV1AuthLoginRequest,
  POSTV1AuthLoginResponse,
  POSTV1AuthPasskeyOptionsResponse,
  POSTV1AuthPasskeyVerifyRequest,
  POSTV1AuthPasskeyVerifyResponse,
  POSTV1LibraryHistoryImportBody,
  POSTV1LibraryHistoryImportResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export async function importReadingHistory(request: POSTV1LibraryHistoryImportBody) {
  const url = new URL('/api/v1/library/history/import', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1LibraryHistoryImportResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function login(request: POSTV1AuthLoginRequest) {
  const url = new URL('/api/v1/auth/login', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1AuthLoginResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function requestPasskeyAuthenticationOptions() {
  const url = new URL('/api/v1/auth/passkey/options', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1AuthPasskeyOptionsResponse>(url, {
    method: 'POST',
  })

  return data
}

export async function verifyPasskeyAuthentication(request: POSTV1AuthPasskeyVerifyRequest) {
  const url = new URL('/api/v1/auth/passkey/verify', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1AuthPasskeyVerifyResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function verifyTwoFactorLogin(request: POSTV1AuthLogin2FARequest) {
  const url = new URL('/api/v1/auth/login/2fa', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<POSTV1AuthLogin2FAResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
