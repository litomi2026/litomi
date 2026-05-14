const probeState = {
  startupComplete: false,
  draining: false,
}

let signalHandlersRegistered = false

export function getProbeStateSnapshot() {
  return {
    startupComplete: probeState.startupComplete,
    draining: probeState.draining,
  }
}

export function markProbeDraining() {
  probeState.draining = true
}

export function markProbeStartupComplete() {
  probeState.startupComplete = true
}

export function registerProbeSignalHandlers() {
  if (signalHandlersRegistered) {
    return
  }

  process.once('SIGTERM', markProbeDraining)
  process.once('SIGINT', markProbeDraining)
  signalHandlersRegistered = true
}

export function resetProbeStateForTest() {
  probeState.startupComplete = false
  probeState.draining = false
}
