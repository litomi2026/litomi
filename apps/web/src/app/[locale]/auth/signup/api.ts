import type { POSTV1AuthSignupRequest, POSTV1AuthSignupResponse } from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function signup(request: POSTV1AuthSignupRequest) {
  const url = '/api/v1/auth/signup'

  const { data } = await fetchAPIData<POSTV1AuthSignupResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return data
}
