const CLEARANCE_WAIT_TIMEOUT_MS = 3000

let clearanceReady = false
let resolveClearance: () => void = () => {}

const clearancePromise = new Promise<void>((resolve) => {
  resolveClearance = resolve
})

export function markOriginProtectionClearanceReady() {
  clearanceReady = true
  resolveClearance()
}

export function releaseOriginProtectionClearanceWait() {
  resolveClearance()
}

export async function waitForOriginProtectionClearance() {
  if (clearanceReady || typeof window === 'undefined') {
    return
  }

  const timeout = new Promise<void>((resolve) => {
    setTimeout(() => {
      releaseOriginProtectionClearanceWait()
      resolve()
    }, CLEARANCE_WAIT_TIMEOUT_MS)
  })

  await Promise.race([clearancePromise, timeout])
}
