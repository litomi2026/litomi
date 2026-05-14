import { env } from '@litomi/env/env/client'

import type { PATCHV1MePasswordBody, PATCHV1MePasswordResponse } from '@/backend/api/v1/me/password'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function changeMyPassword(body: PATCHV1MePasswordBody) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me/password`

  const { data } = await fetchWithErrorHandling<PATCHV1MePasswordResponse>(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
