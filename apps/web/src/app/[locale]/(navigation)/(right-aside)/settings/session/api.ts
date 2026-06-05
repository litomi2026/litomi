import type { DELETEV1MeSessionResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export async function revokeAllPersistentSessions() {
  const url = new URL('/api/v1/me/session/all', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function revokeOtherPersistentSessions() {
  const url = new URL('/api/v1/me/session/others', NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function revokePersistentSession(familyId: string) {
  const url = new URL(`/api/v1/me/session/${encodeURIComponent(familyId)}`, NEXT_PUBLIC_APP_ORIGIN)

  const { data } = await fetchAPIData<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
  })

  return data
}
