export async function parseRewardedAdsErrorResponse(response: Response) {
  const remainingSeconds = getRetryAfterSeconds(response)
  const message = await response.text()

  return {
    error: message || '오류가 발생했어요',
    remainingSeconds,
  }
}

function getRetryAfterSeconds(response: Response) {
  const retryAfter = response.headers.get('Retry-After')
  if (!retryAfter) {
    return undefined
  }

  const seconds = Number(retryAfter)
  return Number.isFinite(seconds) ? seconds : undefined
}
