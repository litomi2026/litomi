export type ShutdownHandler = () => Promise<void> | void
export type ShutdownSignal = 'SIGINT' | 'SIGTERM'

const shutdownHandlers = new Map<string, ShutdownHandler>()
const shutdownTimeoutMs = 10_000

let shuttingDown = false
let signalsRegistered = false

export function registerShutdownHandler(name: string, handler: ShutdownHandler): void {
  shutdownHandlers.set(name, handler)
}

export function registerShutdownSignals(): void {
  if (signalsRegistered) {
    return
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
  signalsRegistered = true
}

function getExitCode(signal: ShutdownSignal): number {
  return signal === 'SIGINT' ? 130 : 143
}

async function shutdown(signal: ShutdownSignal): Promise<void> {
  if (shuttingDown) {
    process.exit(getExitCode(signal))
  }

  shuttingDown = true

  const timeout = setTimeout(() => {
    console.error(`Timed out while shutting down after ${signal}`)
    process.exit(1)
  }, shutdownTimeoutMs)

  timeout.unref?.()

  for (const [name, handler] of shutdownHandlers) {
    try {
      await handler()
    } catch (error) {
      console.error(`Failed to run ${name} shutdown handler`, error)
    }
  }

  clearTimeout(timeout)
  process.exit(getExitCode(signal))
}
