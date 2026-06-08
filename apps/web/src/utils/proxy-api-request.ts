import { clearanceGate } from '@/lib/cloudflare/clearance'
import { fetchAPIData } from '@/utils/api-request'

export async function fetchProxyAPIData<T>(input: string | Request | URL, init?: RequestInit) {
  try {
    await clearanceGate.wait()
    return await fetchAPIData<T>(input, { ...init, credentials: 'include' })
  } catch (error) {
    clearanceGate.reportFetchError(error)
    throw error
  }
}
