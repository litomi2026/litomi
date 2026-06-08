import { HTTPResponseError } from '@/utils/api-request'

const CLEARANCE_WAIT_TIMEOUT_MS = 3000
export const VERIFICATION_REQUIRED_EVENT = 'litomi:verification-required'

type ClearanceState = 'prechecking' | 'ready' | 'verification-required'

class ClearanceGate {
  private gate = createDeferred()
  private state: ClearanceState = 'prechecking'

  markReady = () => {
    this.state = 'ready'
    this.gate.resolve()
  }

  releaseWait = () => {
    if (this.state === 'verification-required') {
      return
    }

    this.gate.resolve()
  }

  reportFetchError = (error: unknown) => {
    if (!isOriginProtectionFetchError(error)) {
      return
    }

    if (this.state === 'verification-required') {
      return
    }

    this.state = 'verification-required'
    this.gate = createDeferred()

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(VERIFICATION_REQUIRED_EVENT))
    }
  }

  wait = async () => {
    if (this.state === 'ready' || typeof window === 'undefined') {
      return
    }

    if (this.state === 'verification-required') {
      await this.gate.promise
      return
    }

    await Promise.race([this.gate.promise, timeout(CLEARANCE_WAIT_TIMEOUT_MS)])
  }
}

export const clearanceGate = new ClearanceGate()

function createDeferred() {
  let resolve: () => void = () => {}

  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function isOriginProtectionFetchError(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof HTTPResponseError &&
      (error.status === 403 || error.response.headers.get('cf-mitigated') === 'challenge'))
  )
}

function timeout(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}
