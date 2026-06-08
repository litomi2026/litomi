import { HTTPResponseError } from '@/utils/api-request'

const CLEARANCE_WAIT_TIMEOUT_MS = 3000
export const VERIFICATION_REQUIRED_EVENT = 'litomi:verification-required'

let clearanceReady = false
let verificationRequired = false
let clearanceWait = createClearanceWait()

export function markOriginProtectionClearanceReady() {
  clearanceReady = true
  verificationRequired = false
  clearanceWait.resolve()
}

export function releaseOriginProtectionClearanceWait() {
  clearanceWait.resolve()

  if (verificationRequired && !clearanceReady) {
    clearanceWait = createClearanceWait()
  }
}

export function reportOriginProtectionFetchError(error: unknown) {
  if (!isOriginProtectionFetchError(error)) {
    return
  }

  clearanceReady = false

  if (verificationRequired) {
    return
  }

  verificationRequired = true
  clearanceWait = createClearanceWait()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(VERIFICATION_REQUIRED_EVENT))
  }
}

export async function waitForOriginProtectionClearance() {
  if (clearanceReady || typeof window === 'undefined') {
    return
  }

  if (verificationRequired) {
    await clearanceWait.promise
    return
  }

  const timeout = new Promise<void>((resolve) => {
    setTimeout(resolve, CLEARANCE_WAIT_TIMEOUT_MS)
  })

  await Promise.race([clearanceWait.promise, timeout])
}

function createClearanceWait() {
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
