const probeState = {
  startupComplete: false,
  draining: false,
}

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

export function resetProbeStateForTest() {
  probeState.startupComplete = false
  probeState.draining = false
}
