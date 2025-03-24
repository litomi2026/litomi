// Client side ONLY

export async function fetchImageWithRetry(url: string, attempt = 1): Promise<Blob> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return await res.blob()
  } catch (error) {
    if (attempt < 3) {
      const delay = 1000 * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return fetchImageWithRetry(url, attempt + 1)
    }
    throw error
  }
}

export function getSafeAreaBottom() {
  return parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom'))
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
