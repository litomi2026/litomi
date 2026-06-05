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

import { fetchAPIData } from '@/utils/api-request'

export async function importReadingHistory(request: POSTV1LibraryHistoryImportBody) {
  const url = '/api/v1/library/history/import'

  const { data } = await fetchAPIData<POSTV1LibraryHistoryImportResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function login(request: POSTV1AuthLoginRequest) {
  const url = '/api/v1/auth/login'

  const { data } = await fetchAPIData<POSTV1AuthLoginResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function requestPasskeyAuthenticationOptions() {
  const url = '/api/v1/auth/passkey/options'

  const { data } = await fetchAPIData<POSTV1AuthPasskeyOptionsResponse>(url, {
    method: 'POST',
  })

  return data
}

export async function verifyPasskeyAuthentication(request: POSTV1AuthPasskeyVerifyRequest) {
  const url = '/api/v1/auth/passkey/verify'

  const { data } = await fetchAPIData<POSTV1AuthPasskeyVerifyResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function verifyTwoFactorLogin(request: POSTV1AuthLogin2FARequest) {
  const url = '/api/v1/auth/login/2fa'

  const { data } = await fetchAPIData<POSTV1AuthLogin2FAResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
