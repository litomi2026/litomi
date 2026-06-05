import type {
  DELETEV1MePasskeyResponse,
  PATCHV1MePasskeyBody,
  PATCHV1MePasskeyResponse,
  POSTV1MePasskeyOptionsResponse,
  POSTV1MePasskeyVerifyBody,
  POSTV1MePasskeyVerifyResponse,
} from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function deletePasskey(id: number) {
  const url = `/api/v1/me/passkey/${id}`

  const { data } = await fetchAPIData<DELETEV1MePasskeyResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function requestPasskeyRegistrationOptions() {
  const url = '/api/v1/me/passkey/options'

  const { data } = await fetchAPIData<POSTV1MePasskeyOptionsResponse>(url, {
    method: 'POST',
  })

  return data
}

export async function updatePasskeyName(id: number, request: PATCHV1MePasskeyBody) {
  const url = `/api/v1/me/passkey/${id}`

  const { data } = await fetchAPIData<PATCHV1MePasskeyResponse>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}

export async function verifyPasskeyRegistration(request: POSTV1MePasskeyVerifyBody) {
  const url = '/api/v1/me/passkey/verify'

  const { data } = await fetchAPIData<POSTV1MePasskeyVerifyResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
