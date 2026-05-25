import type {
  DELETEV1MeTrustedBrowserAllResponse,
  DELETEV1MeTrustedBrowserResponse,
  DELETEV1MeTwoFactorBody,
  DELETEV1MeTwoFactorResponse,
  POSTV1MeTwoFactorBackupCodesBody,
  POSTV1MeTwoFactorBackupCodesResponse,
  POSTV1MeTwoFactorSetupResponse,
  POSTV1MeTwoFactorVerifyBody,
  POSTV1MeTwoFactorVerifyResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function disableTwoFactor(body: DELETEV1MeTwoFactorBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/two-factor`

  const { data } = await fetchAPIData<DELETEV1MeTwoFactorResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function regenerateTwoFactorBackupCodes(body: POSTV1MeTwoFactorBackupCodesBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/two-factor/backup-codes`

  const { data } = await fetchAPIData<POSTV1MeTwoFactorBackupCodesResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function requestTwoFactorSetup() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/two-factor/setup`

  const { data } = await fetchAPIData<POSTV1MeTwoFactorSetupResponse>(url, {
    method: 'POST',
    credentials: 'include',
  })

  return data
}

export async function revokeAllTrustedBrowsers() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/trusted-browser/all`

  const { data } = await fetchAPIData<DELETEV1MeTrustedBrowserAllResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function revokeTrustedBrowser(id: number) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/trusted-browser/${id}`

  const { data } = await fetchAPIData<DELETEV1MeTrustedBrowserResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function verifyTwoFactorSetup(body: POSTV1MeTwoFactorVerifyBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/two-factor/verify`

  const { data } = await fetchAPIData<POSTV1MeTwoFactorVerifyResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
