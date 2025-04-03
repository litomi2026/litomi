import { getRandomDecimal } from './random'

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
        delay = Math.min(
          (delay + getRandomDecimal() * random) * multiplier,
          maxDelay + getRandomDecimal() * maxDelayRandom,
        )
      } catch (err) {
        if (err instanceof Error) {
          reject(err.message)
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          reject(err.message)
        } else if (typeof err === 'string') {
          reject(err)
        } else {
          reject('Unknown error')
        }
      }
    }

    retry()
  })
}
