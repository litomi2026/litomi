import { createProblemTypeUrl, getStatusTitle, isProblemDetails, type ProblemDetails } from './problem-details'

export class ProblemDetailsError extends Error {
  readonly name = 'ProblemDetailsError'

  get isRetryable(): boolean {
    return this.status === 408 || this.status === 429 || this.status >= 500
  }

  get retryAfterSeconds(): number | undefined {
    const value = this.response?.headers?.get('Retry-After')
    if (!value) {
      return undefined
    }

    // 1) delta-seconds (e.g. "120")
    const seconds = Number(value)
    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds
    }

    // 2) HTTP-date (e.g. "Wed, 21 Oct 2015 07:28:00 GMT")
    const timeMs = Date.parse(value)
    if (!Number.isFinite(timeMs)) {
      return undefined
    }

    const diffSeconds = Math.ceil((timeMs - Date.now()) / 1000)
    return diffSeconds > 0 ? diffSeconds : undefined
  }

  get status(): number {
    return this.problem.status
  }

  get type(): string {
    return this.problem.type
  }

  constructor(
    public readonly problem: ProblemDetails,
    public readonly response?: Response,
  ) {
    super(problem.detail ?? problem.title)
  }
}

export async function fetchWithErrorHandling<T>(
  input: string | Request | URL,
  init?: RequestInit,
): Promise<{ data: T; response: Response }> {
  try {
    const response = await fetch(input, init)

    if (!response.ok) {
      const problem = await parseProblemDetailsFromResponse(response, input)
      throw new ProblemDetailsError(problem, response)
    }

    if (response.status === 204 || response.status === 205) {
      return { data: undefined as T, response }
    }

    const data = (await response.json()) as T
    return { data, response }
  } catch (error) {
    if (error instanceof ProblemDetailsError) {
      throw error
    }

    const origin = getOriginFromInput(input)

    const problem: ProblemDetails = {
      type: origin ? createProblemTypeUrl(origin, 'client-network-error') : 'about:blank',
      title: getStatusTitle(503),
      status: 503,
      detail: '네트워크 연결을 확인해 주세요',
    }

    if (error instanceof Error && error.name === 'AbortError') {
      problem.type = origin ? createProblemTypeUrl(origin, 'client-aborted') : 'about:blank'
      problem.title = getStatusTitle(499)
      problem.status = 499
      problem.detail = '요청이 취소됐어요'
    }

    throw new ProblemDetailsError(problem)
  }
}

function getBrowserOrigin(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.location?.origin ?? null
}

function getOriginFromInput(input: string | Request | URL): string | null {
  if (input instanceof URL) {
    return input.origin
  }

  if (input instanceof Request) {
    try {
      return new URL(input.url).origin
    } catch {
      return getBrowserOrigin()
    }
  }

  if (typeof input === 'string') {
    try {
      return new URL(input).origin
    } catch {
      return getBrowserOrigin()
    }
  }

  return getBrowserOrigin()
}

async function parseProblemDetailsFromResponse(
  response: Response,
  input: string | Request | URL,
): Promise<ProblemDetails> {
  const origin = getOriginFromInput(input)

  const maybeJson = await response
    .clone()
    .json()
    .catch(() => undefined)

  if (isProblemDetails(maybeJson)) {
    return maybeJson
  }

  const text = await response.text().catch(() => '')
  const title = getStatusTitle(response.status)

  return {
    type: origin ? createProblemTypeUrl(origin, `http-${response.status}`) : 'about:blank',
    title,
    status: response.status,
    detail: text || title,
  }
}
