import type { PATCHV1MePasswordBody, PATCHV1MePasswordResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function changeMyPassword(body: PATCHV1MePasswordBody) {
  const url = new URL('/api/v1/me/password', NEXT_PUBLIC_API_ORIGIN)

  const { data } = await fetchAPIData<PATCHV1MePasswordResponse>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
