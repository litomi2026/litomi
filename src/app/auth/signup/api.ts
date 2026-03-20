import type { POSTV1AuthSignupRequest, POSTV1AuthSignupResponse } from '@/backend/api/v1/auth/signup'

import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function signup(request: POSTV1AuthSignupRequest) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/signup`

  const { data } = await fetchWithErrorHandling<POSTV1AuthSignupResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
