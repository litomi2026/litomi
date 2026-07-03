// After a deploy, a client still holding a previous build's HTML/RSC payload can load a chunk graph that no longer
// matches: a dynamic import 404s, or a cached chunk calls into a sibling chunk whose exports changed. These surface
// as the patterns below — NOT as application logic bugs — so the right recovery is a one-time hard reload onto the
// current build rather than showing an error.
const STALE_DEPLOYMENT_ERROR_PATTERNS: RegExp[] = [
  /ChunkLoadError/,
  /Loading (?:CSS )?chunk \d+ failed/i,
  /(?:Failed to fetch|error loading) dynamically imported module/i,
  // Bundler ESM-interop call `(0,mod.export)` resolving to a non-function means a loaded chunk references an export a
  // sibling chunk no longer provides — the classic stale chunk graph. e.g. "(0,h.ensureSuspenseTimers) is not a function".
  /\(0,\s*\w+\.\w+\) is not a function/,
  // Turbopack cross-build chunk mix: a chunk from another build requires a numeric module id whose factory was never
  // registered in this runtime. e.g. "Module 927865 was instantiated because it was required from module 939727,
  // but the module factory is not available."
  /module factory is not available/i,
]

const RELOAD_AT_STORAGE_KEY = 'litomi:stale-deploy-reloaded-at'
const RELOAD_COOLDOWN_MS = 30_000

export function isStaleDeploymentError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return STALE_DEPLOYMENT_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

export function reloadIfStaleDeployment(error: unknown): boolean {
  if (typeof window === 'undefined' || !isStaleDeploymentError(error)) {
    return false
  }

  try {
    const reloadedAt = Number(window.sessionStorage.getItem(RELOAD_AT_STORAGE_KEY))

    // If the same error recurs within this window after we already reloaded, the fresh build did not fix it
    if (Number.isFinite(reloadedAt) && Date.now() - reloadedAt < RELOAD_COOLDOWN_MS) {
      return false
    }

    window.sessionStorage.setItem(RELOAD_AT_STORAGE_KEY, String(Date.now()))
  } catch {
    // sessionStorage blocked (private mode / restricted webview)
    return false
  }

  window.location.reload()
  return true
}
