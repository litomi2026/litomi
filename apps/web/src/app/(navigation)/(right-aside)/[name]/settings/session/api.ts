import { env } from '@litomi/env/env/client'

import type { DELETEV1MeSessionResponse } from '@/backend/api/v1/me/session'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function revokeAllPersistentSessions() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/session/all`

  const { data } = await fetchWithErrorHandling<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function revokeOtherPersistentSessions() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/session/others`

  const { data } = await fetchWithErrorHandling<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}

export async function revokePersistentSession(familyId: string) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/session/${encodeURIComponent(familyId)}`

  const { data } = await fetchWithErrorHandling<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
    credentials: 'include',
  })

  return data
}
