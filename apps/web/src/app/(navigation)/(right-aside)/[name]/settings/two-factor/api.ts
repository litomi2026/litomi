import type {
  DELETEV1MeTrustedBrowserAllResponse,
  DELETEV1MeTrustedBrowserResponse,
  POSTV1MeTwoFactorSetupResponse,
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
