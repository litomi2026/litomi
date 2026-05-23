import type {
  DELETEV1MePasskeyResponse,
  POSTV1MePasskeyOptionsResponse,
  POSTV1MePasskeyVerifyBody,
  POSTV1MePasskeyVerifyResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deletePasskey(id: number) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/passkey/${id}`

  const { data } = await fetchWithErrorHandling<DELETEV1MePasskeyResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function requestPasskeyRegistrationOptions() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/passkey/options`

  const { data } = await fetchWithErrorHandling<POSTV1MePasskeyOptionsResponse>(url, {
    method: 'POST',
    credentials: 'include',
  })

  return data
}

export async function verifyPasskeyRegistration(request: POSTV1MePasskeyVerifyBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/passkey/verify`

  const { data } = await fetchWithErrorHandling<POSTV1MePasskeyVerifyResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
