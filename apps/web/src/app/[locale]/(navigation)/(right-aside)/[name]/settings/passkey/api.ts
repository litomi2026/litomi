import type {
  DELETEV1MePasskeyResponse,
  PATCHV1MePasskeyBody,
  PATCHV1MePasskeyResponse,
  POSTV1MePasskeyOptionsResponse,
  POSTV1MePasskeyVerifyBody,
  POSTV1MePasskeyVerifyResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function deletePasskey(id: number) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/passkey/${id}`

  const { data } = await fetchAPIData<DELETEV1MePasskeyResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function requestPasskeyRegistrationOptions() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/passkey/options`

  const { data } = await fetchAPIData<POSTV1MePasskeyOptionsResponse>(url, {
    method: 'POST',
    credentials: 'include',
  })

  return data
}

export async function updatePasskeyName(id: number, request: PATCHV1MePasskeyBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/passkey/${id}`

  const { data } = await fetchAPIData<PATCHV1MePasskeyResponse>(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function verifyPasskeyRegistration(request: POSTV1MePasskeyVerifyBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/passkey/verify`

  const { data } = await fetchAPIData<POSTV1MePasskeyVerifyResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
