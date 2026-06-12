import { isProblemDetails, isProblemDetailsContentType, type ProblemDetails } from '@litomi/http/problem-details'

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

  constructor(
    public readonly problem: ProblemDetails,
    public readonly response?: Response,
  ) {
    super(problem.detail ?? problem.title)
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

function isJsonContentType(contentType: string | null | undefined): boolean {
  return contentType?.toLowerCase().includes('json') === true
}

// NOTE: Cloudflare WAF 응답은 application/json 형태만 허용해서 Problem Details body 형태를 검증 후 처리해요.
function isProblemDetailsReadableContentType(contentType: string | null | undefined): boolean {
  return isProblemDetailsContentType(contentType) || isJsonContentType(contentType)
}

async function readProblemDetails(response: Response): Promise<ProblemDetails | null> {
  if (!isProblemDetailsReadableContentType(response.headers.get('Content-Type'))) {
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
