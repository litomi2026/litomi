import type {
  DELETEV1MeTrustedBrowserAllResponse,
  DELETEV1MeTrustedBrowserResponse,
  POSTV1MeTwoFactorSetupResponse,
  POSTV1MeTwoFactorVerifyBody,
  POSTV1MeTwoFactorVerifyResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function requestTwoFactorSetup() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/two-factor/setup`

  const { data } = await fetchWithErrorHandling<POSTV1MeTwoFactorSetupResponse>(url, {
    method: 'POST',
    credentials: 'include',
  })

  return data
}

export async function revokeAllTrustedBrowsers() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/trusted-browser/all`

  const { data } = await fetchWithErrorHandling<DELETEV1MeTrustedBrowserAllResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function revokeTrustedBrowser(id: number) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/trusted-browser/${id}`

  const { data } = await fetchWithErrorHandling<DELETEV1MeTrustedBrowserResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function verifyTwoFactorSetup(body: POSTV1MeTwoFactorVerifyBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/two-factor/verify`

  const { data } = await fetchWithErrorHandling<POSTV1MeTwoFactorVerifyResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
