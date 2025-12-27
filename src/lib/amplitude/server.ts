import * as amplitude from '@amplitude/analytics-node'

import { env } from '@/env/server'

const { AMPLITUDE_API_KEY } = env

// Initialize Amplitude once
let isInitialized = false
let isInitializing = false

type AmplitudeEventProperties = {
  eventInput: string
  userId: number | string
  userProperties?: Record<string, unknown>
  eventProperties?: Record<string, unknown>
}

export async function trackAmplitudeEvent({
  userId,
  eventInput,
  userProperties,
  eventProperties,
}: AmplitudeEventProperties): Promise<boolean> {
  if (!AMPLITUDE_API_KEY) {
    console.warn('Amplitude API key not configured')
    return false
  }

  try {
    ensureInitialized()

    // Track the event with user properties
    const result = await amplitude.track(eventInput, eventProperties, {
      user_id: userId.toString(),
    }).promise

    // Set user properties separately if provided
    if (userProperties && Object.keys(userProperties).length > 0) {
      const identifyObj = new amplitude.Identify()

      // Set each user property
      Object.entries(userProperties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          identifyObj.set(key, value as boolean | number | string | string[])
        }
      })

      await amplitude.identify(identifyObj, { user_id: userId.toString() }).promise
    }

    return result?.code === 200
  } catch (error) {
    console.error('Error tracking Amplitude event:', error)
    return false
  }
}

function ensureInitialized() {
  if (!isInitialized && !isInitializing && AMPLITUDE_API_KEY) {
    isInitializing = true
    amplitude.init(AMPLITUDE_API_KEY, { minIdLength: 1 })
    isInitialized = true
    isInitializing = false
  }
}
