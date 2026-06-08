import { clearanceGate } from '@/lib/cloudflare/clearance'
import { fetchResponseData } from '@/utils/fetch-response'

export async function fetchProxyAPIData<T>(input: string | Request | URL, init?: RequestInit) {
  const request = new Request(input, { ...init, credentials: 'include' })

  try {
    await clearanceGate.wait()
    return await fetchResponseData<T>(request.clone())
  } catch (error) {
    if (!clearanceGate.reportFetchError(error) || request.method !== 'GET') {
      throw error
    }

    try {
      await clearanceGate.wait()
    } catch {
      throw error
    }

    return await fetchResponseData<T>(request.clone())
  }
}
