export const exponentialBackoff = <T>(
  onRun: () => [false, null] | [true, T],
  { maxRetry = -1, initialDelay = 5, multiplier = 4, random = 1, maxDelay = 200, maxDelayRandom = 10 } = {},
) => {
  let delay = initialDelay
  let count = 0
  return new Promise<T | null>((resolve, reject) => {
    const retry = () => {
      try {
        const result = onRun()
        if (result[0]) {
          resolve(result[1])
          return
        }

        count += 1
        if (maxRetry > 0 && count >= maxRetry) {
          resolve(null)
          return
        }

        setTimeout(retry, delay)
        delay = Math.min((delay + Math.random() * random) * multiplier, maxDelay + Math.random() * maxDelayRandom)
      } catch (err) {
        reject(err)
      }
    }

    retry()
  })
}
