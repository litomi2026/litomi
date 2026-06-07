import { reportOriginProtectionFetchError, waitForOriginProtectionClearance } from '@/lib/origin-protection/clearance'
import { fetchAPIData } from '@/utils/api-request'

export async function fetchProxyAPIData<T>(input: string | Request | URL, init?: RequestInit) {
  try {
    await waitForOriginProtectionClearance()
    return await fetchAPIData<T>(input, { ...init, credentials: 'include' })
  } catch (error) {
    reportOriginProtectionFetchError(error)
    throw error
  }
}
