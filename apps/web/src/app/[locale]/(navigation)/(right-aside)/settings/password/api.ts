import type { PATCHV1MePasswordBody, PATCHV1MePasswordResponse } from '@litomi/contracts'

import { fetchAPIData } from '@/utils/api-request'

export async function changeMyPassword(body: PATCHV1MePasswordBody) {
  const url = '/api/v1/me/password'

  const { data } = await fetchAPIData<PATCHV1MePasswordResponse>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}
