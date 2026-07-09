import { clearanceGate } from '@/lib/cloudflare/clearance'
import { fetchResponseData, OpaqueOriginError } from '@/utils/fetch-response'

export async function fetchProxyAPIData<T>(input: string | Request | URL, init?: RequestInit) {
  const request = new Request(input, { ...init, credentials: 'include' })

  try {
    await clearanceGate.wait()
    return await fetchResponseData<T>(request.clone())
  } catch (error) {
    if (!clearanceGate.reportFetchError(error) || request.method !== 'GET') {
      if (isOnlineFetchTypeError(error)) {
        throw new OpaqueOriginError({ cause: error })
      }

      throw error
    }

    try {
      await clearanceGate.wait()
    } catch {
      if (isOnlineFetchTypeError(error)) {
        throw new OpaqueOriginError({ cause: error })
      }

      throw error
    }

    try {
      return await fetchResponseData<T>(request.clone())
    } catch (retryError) {
      if (isOnlineFetchTypeError(retryError)) {
        throw new OpaqueOriginError({ cause: retryError })
      }

      throw retryError
    }
  }
}

function isOnlineFetchTypeError(error: unknown): boolean {
  return error instanceof TypeError && typeof navigator !== 'undefined' && navigator.onLine
}
