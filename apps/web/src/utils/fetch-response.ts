import {
  getProblemCode,
  isProblemDetails,
  isProblemDetailsContentType,
  type ProblemDetails,
} from '@litomi/http/problem-details'

export class HTTPResponseError extends Error {
  readonly name = 'HTTPResponseError'

  get isRetryable(): boolean {
    return this.status === 408 || this.status === 429 || this.status >= 500
  }

  get retryAfterSeconds(): number | undefined {
    return getRetryAfterSeconds(this.response)
  }

  get status(): number {
    return this.response.status
  }

  constructor(public readonly response: Response) {
    super(response.statusText ? `HTTP ${response.status} ${response.statusText}` : `HTTP ${response.status}`)
  }
}

export class ProblemDetailsError extends Error {
  readonly name = 'ProblemDetailsError'

  get isRetryable(): boolean {
    return this.status === 408 || this.status === 429 || this.status >= 500
  }

  get retryAfterSeconds(): number | undefined {
    return getRetryAfterSeconds(this.response)
  }

  get status(): number {
    return this.problem.status
  }

  get type(): string {
    return this.problem.type
  }

  // message는 진단용(Sentry·로그) — 사용자 표시는 problem code를 Errors 카탈로그로 변환한다.
  constructor(
    public readonly problem: ProblemDetails,
    public readonly response?: Response,
  ) {
    const code = getProblemCode(problem.type)
    const summary = problem.detail ?? problem.title
    const meta = [problem.status, code].filter(Boolean).join(' ')
    super(`[${meta}] ${summary}`)
  }
}

export async function fetchResponseData<T>(
  input: string | Request | URL,
  init?: RequestInit,
): Promise<{ data: T; response: Response }> {
  const request = new Request(input, init)
  const response = await fetch(request.clone())

  if (!response.ok) {
    throw await createResponseError(response)
  }

  return {
    data: await readResponseData<T>(response),
    response,
  }
}

async function createResponseError(response: Response): Promise<HTTPResponseError | ProblemDetailsError> {
  const problem = await readProblemDetails(response)

  if (problem) {
    return new ProblemDetailsError(problem, response)
  }

  return new HTTPResponseError(response)
}

function getRetryAfterSeconds(response?: Response): number | undefined {
  const value = response?.headers?.get('Retry-After')
  if (!value) {
    return undefined
  }

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds
  }

  const timeMs = Date.parse(value)
  if (!Number.isFinite(timeMs)) {
    return undefined
  }

  const diffSeconds = Math.ceil((timeMs - Date.now()) / 1000)
  return diffSeconds > 0 ? diffSeconds : undefined
}

async function readProblemDetails(response: Response): Promise<ProblemDetails | null> {
  if (!isProblemDetailsContentType(response.headers.get('Content-Type'))) {
    return null
  }

  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null)

  return isProblemDetails(body) ? body : null
}

async function readResponseData<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return undefined as T
  }

  const contentType = response.headers.get('Content-Type')?.toLowerCase() ?? ''

  if (contentType.includes('json')) {
    return (await response.json()) as T
  }

  const text = await response.text()
  return (text || undefined) as T
}
