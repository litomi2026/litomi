let amplitudeInstance: typeof import('@amplitude/analytics-browser') | null = null
let isInitialized = false
let isInitializing = false
const actionQueue: Array<() => void> = []

export function init(apiKey: string, options?: Record<string, unknown>): void {
  if (!apiKey) return

  ensureAmplitude()
    .then((amplitude) => {
      amplitude.init(apiKey, options)
      isInitialized = true
      processQueue()
    })
    .catch((error) => {
      console.error('Amplitude 초기화 실패:', error)
    })
}

export function reset(): void {
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

export function setUserId(userId: number | string): void {
  const action = () => {
    if (amplitudeInstance && isInitialized) {
      amplitudeInstance.setUserId(String(userId))
    }
  }

  if (!isInitialized) {
    actionQueue.push(action)
  } else {
    action()
  }
}

export function track(event: string, properties?: Record<string, unknown>): void {
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
    console.error('Amplitude 불러오기 실패:', error)
    throw error
  } finally {
    isInitializing = false
  }
}

async function processQueue() {
  if (!isInitialized || actionQueue.length === 0) return

  while (actionQueue.length > 0) {
    const action = actionQueue.shift()
    action?.()
  }
}

const amplitude = {
  init,
  reset,
  setUserId,
  track,
}

export default amplitude
