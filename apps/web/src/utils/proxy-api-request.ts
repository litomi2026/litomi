import { clearanceGate } from '@/lib/cloudflare/clearance'
import { fetchResponseData, HTTPResponseError } from '@/utils/fetch-response'

export async function fetchProxyAPIData<T>(input: string | Request | URL, init?: RequestInit) {
  const request = new Request(input, { ...init, credentials: 'include' })

  try {
    await clearanceGate.wait()
    return await fetchResponseData<T>(request.clone())
  } catch (error) {
    if (!clearanceGate.reportFetchError(error) || request.method !== 'GET') {
      if (error instanceof TypeError && typeof navigator !== 'undefined' && navigator.onLine) {
        throw new HTTPResponseError(new Response(null, { status: 403 }))
      }

      throw error
    }

    try {
      await clearanceGate.wait()
    } catch {
      if (error instanceof TypeError && typeof navigator !== 'undefined' && navigator.onLine) {
        throw new HTTPResponseError(new Response(null, { status: 403 }))
      }

      throw error
    }

    try {
      return await fetchResponseData<T>(request.clone())
    } catch (retryError) {
      if (retryError instanceof TypeError && typeof navigator !== 'undefined' && navigator.onLine) {
        throw new HTTPResponseError(new Response(null, { status: 403 }))
      }

      throw retryError
    }
  }
}
