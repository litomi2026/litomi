import { getInvalidParams, isProblemDetails, PROBLEM_CONTENT_TYPE, type ProblemDetails } from '@litomi/http/problem-details'
import { expect } from 'bun:test'

type ExpectedInvalidParam = {
  name: string
  reason?: string
}

type ExpectedProblemResponse = {
  code?: string
  detail?: string
  instance?: string
  status: number
  title?: string
}

export function expectInvalidParams(problem: ProblemDetails, expected: readonly ExpectedInvalidParam[]) {
  const invalidParams = getInvalidParams(problem)

  for (const entry of expected) {
    const match = invalidParams.find((invalidParam) => invalidParam.name === entry.name)

    expect(match).toBeDefined()

    if (entry.reason !== undefined) {
      expect(match?.reason).toBe(entry.reason)
    }
  }
}

export async function expectProblemResponse(response: Response, expected: ExpectedProblemResponse) {
  expect(response.status).toBe(expected.status)
  expect(response.headers.get('Content-Type')?.split(';', 1)[0]).toBe(PROBLEM_CONTENT_TYPE)

  const body = await response.json()
  expect(isProblemDetails(body)).toBe(true)

  const problem = body as ProblemDetails
  expect(problem.status).toBe(expected.status)

  if (expected.code) {
    const typeUrl = new URL(problem.type)

    expect(typeUrl.protocol).toBe('https:')
    expect(typeUrl.pathname).toBe(`/problems/${encodeURIComponent(expected.code)}`)
  }

  if (expected.title !== undefined) {
    expect(problem.title).toBe(expected.title)
  }

  if (expected.detail !== undefined) {
    expect(problem.detail).toBe(expected.detail)
  }

  if (expected.instance !== undefined) {
    expect(problem.instance).toBe(expected.instance)
  }

  return problem
}
