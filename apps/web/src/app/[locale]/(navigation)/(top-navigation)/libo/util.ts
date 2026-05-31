export function runWhenDocumentVisible(task: () => void) {
  if (document.visibilityState === 'visible') {
    task()
    return
  }

  const controller = new AbortController()

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      controller.abort()
      task()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange, { signal: controller.signal })
}
