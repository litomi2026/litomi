export async function getCurrentBrowserEndpoint(): Promise<string | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      return null
    }

    return subscription.endpoint
  } catch (error) {
    console.error('Error getting push subscription:', error)
    return null
  }
}
