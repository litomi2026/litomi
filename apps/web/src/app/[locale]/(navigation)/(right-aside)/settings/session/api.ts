import type { DELETEV1MeSessionResponse } from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function revokeAllPersistentSessions() {
  const url = '/api/v1/me/session/all'

  const { data } = await fetchAPIData<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function revokeOtherPersistentSessions() {
  const url = '/api/v1/me/session/others'

  const { data } = await fetchAPIData<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
  })

  return data
}

export async function revokePersistentSession(familyId: string) {
  const url = `/api/v1/me/session/${encodeURIComponent(familyId)}`

  const { data } = await fetchAPIData<DELETEV1MeSessionResponse>(url, {
    method: 'DELETE',
  })

  return data
}
