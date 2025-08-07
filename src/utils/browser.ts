// Client side ONLY

export function checkIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

export function checkIOSSafari(): boolean {
  const isIOS = checkIOSDevice()
  const userAgent = navigator.userAgent
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent)

  return isIOS && isSafari
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
