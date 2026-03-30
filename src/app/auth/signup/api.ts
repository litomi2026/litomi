import type { POSTV1AuthSignupRequest, POSTV1AuthSignupResponse } from '@/backend/api/v1/auth/signup'

import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function signup(request: POSTV1AuthSignupRequest) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/auth/signup`

  const { data } = await fetchWithErrorHandling<POSTV1AuthSignupResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
