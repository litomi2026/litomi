import type { POSTV1AuthSignupRequest, POSTV1AuthSignupResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'

import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function signup(request: POSTV1AuthSignupRequest) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/auth/signup`

  const { data } = await fetchAPIData<POSTV1AuthSignupResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
