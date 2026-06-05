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

import { fetchAPIData } from '@/utils/api-request'

export async function disableTwoFactor(body: DELETEV1MeTwoFactorBody) {
  const url = '/api/v1/me/two-factor'

  const { data } = await fetchAPIData<DELETEV1MeTwoFactorResponse>(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function regenerateTwoFactorBackupCodes(body: POSTV1MeTwoFactorBackupCodesBody) {
  const url = '/api/v1/me/two-factor/backup-codes'

  const { data } = await fetchAPIData<POSTV1MeTwoFactorBackupCodesResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export async function requestTwoFactorSetup() {
  const url = '/api/v1/me/two-factor/setup'

  const { data } = await fetchAPIData<POSTV1MeTwoFactorSetupResponse>(url, {
    method: 'POST',
  })

  return data
}

export async function revokeAllTrustedBrowsers() {
  const url = '/api/v1/me/trusted-browser/all'

  const { data } = await fetchAPIData<DELETEV1MeTrustedBrowserAllResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function revokeTrustedBrowser(id: number) {
  const url = `/api/v1/me/trusted-browser/${id}`

  const { data } = await fetchAPIData<DELETEV1MeTrustedBrowserResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function verifyTwoFactorSetup(body: POSTV1MeTwoFactorVerifyBody) {
  const url = '/api/v1/me/two-factor/verify'

  const { data } = await fetchAPIData<POSTV1MeTwoFactorVerifyResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
