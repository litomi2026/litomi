import { HTTPResponseError } from '@/utils/fetch-response'

const CLEARANCE_WAIT_TIMEOUT_MS = 3000
export const VERIFICATION_REQUIRED_EVENT = 'litomi:verification-required'

export type OriginProtectionClearanceFailureReason =
  | 'client-error'
  | 'expired'
  | 'missing-token'
  | 'siteverify-failed'
  | 'timeout'
  | 'unsupported'

type ClearanceState = 'failed' | 'prechecking' | 'ready' | 'verification-required'

class ClearanceGate {
  private gate = createDeferred()
  private state: ClearanceState = 'prechecking'

  isReady = () => this.state === 'ready'

  markFailed = (reason: OriginProtectionClearanceFailureReason) => {
    if (this.state === 'ready') {
      return
    }

    const verificationRequired = this.state === 'verification-required'
    this.state = 'failed'

    if (verificationRequired) {
      this.gate.reject(new Error(`Origin protection clearance failed: ${reason}`))
      return
    }

    this.gate.resolve()
  }

  markReady = () => {
    this.state = 'ready'
    this.gate.resolve()
  }

  reportFetchError = (error: unknown) => {
    if (!isOriginProtectionFetchError(error)) {
      return false
    }

    if (this.state === 'verification-required') {
      return true
    }

    this.startVerification()

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(VERIFICATION_REQUIRED_EVENT))
    }

    return true
  }

  startVerification = () => {
    if (this.state === 'ready' || this.state === 'verification-required') {
      return
    }

    if (this.state === 'failed') {
      this.gate = createDeferred()
    }

    this.state = 'verification-required'
  }

  wait = async () => {
    if (this.state === 'failed' || this.state === 'ready' || typeof window === 'undefined') {
      return
    }

    if (this.state === 'verification-required') {
      await this.gate.promise
      return
    }

    await Promise.race([this.gate.promise, timeout(CLEARANCE_WAIT_TIMEOUT_MS)])

    if ((this.state as ClearanceState) === 'verification-required') {
      await this.gate.promise
    }
  }
}

export const clearanceGate = new ClearanceGate()

function createDeferred() {
  let reject: (error: Error) => void = () => undefined
  let resolve: () => void = () => undefined

  const promise = new Promise<void>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  void promise.catch(() => undefined)

  return { promise, reject, resolve }
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
