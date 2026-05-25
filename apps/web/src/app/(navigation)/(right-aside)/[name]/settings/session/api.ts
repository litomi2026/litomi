import type { DELETEV1MeSessionResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function revokeAllPersistentSessions() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/session/all`

  const { data } = await fetchAPIData<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function revokeOtherPersistentSessions() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/session/others`

  const { data } = await fetchAPIData<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function revokePersistentSession(familyId: string) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/session/${encodeURIComponent(familyId)}`

  const { data } = await fetchAPIData<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}
