export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  { maxRetries = 3, initialDelay = 1000 } = {},
): Promise<T> {
  let attempt = 0
  let delay = initialDelay
  while (attempt < maxRetries) {
    try {
      return await fn()
    } catch (error) {
      attempt++
      if (attempt >= maxRetries) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2
    }
  }
  // 실제로 여기까지 도달하는 경우는 없음
  throw new Error('알 수 없는 오류가 발생했습니다.')
}
