import { BrowserOptions } from '@amplitude/analytics-browser/lib/esm/types'

let amplitudeInstance: typeof import('@amplitude/analytics-browser') | null = null
let isInitialized = false
let isInitializing = false
const actionQueue: Array<() => void> = []

async function ensureAmplitude(): Promise<typeof import('@amplitude/analytics-browser')> {
  if (amplitudeInstance) {
    return amplitudeInstance
  }

  if (isInitializing) {
    // Wait for ongoing initialization
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (amplitudeInstance) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 50)
    })
    return amplitudeInstance!
  }

  isInitializing = true

  try {
    amplitudeInstance = await import('@amplitude/analytics-browser')
    return amplitudeInstance
  } catch (error) {
    console.error('ensureAmplitude:', error)
    throw error
  } finally {
    isInitializing = false
  }
}

function init(apiKey: string, options?: BrowserOptions): void {
  if (!apiKey) {
    return
  }

  ensureAmplitude()
    .then((amplitude) => {
      amplitude.init(apiKey, options)
      isInitialized = true
      processQueue()
    })
    .catch((error) => {
      console.error('amplitude.init:', error)
    })
}

async function processQueue() {
  if (!isInitialized || actionQueue.length === 0) return

  while (actionQueue.length > 0) {
    const action = actionQueue.shift()
    action?.()
  }
}

function reset(): void {
  const action = () => {
    if (amplitudeInstance && isInitialized) {
      amplitudeInstance.reset()
    }
  }

  if (!isInitialized) {
    actionQueue.push(action)
  } else {
    action()
  }
}

function setUserId(userId: number | string): void {
  const action = () => {
    if (amplitudeInstance && isInitialized) {
      amplitudeInstance.setUserId(userId.toString())
    }
  }

  if (!isInitialized) {
    actionQueue.push(action)
  } else {
    action()
  }
}

function track(event: string, properties?: Record<string, unknown>): void {
  const action = () => {
    if (amplitudeInstance && isInitialized) {
      amplitudeInstance.track(event, properties)
    }
  }

  if (!isInitialized) {
    actionQueue.push(action)
  } else {
    action()
  }
}

const amplitude = {
  init,
  reset,
  setUserId,
  track,
}

export default amplitude
