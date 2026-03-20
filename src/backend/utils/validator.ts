import type { ValidationTargets } from 'hono'

import { zValidator } from '@hono/zod-validator'

import type { InvalidParam } from '@/utils/problem-details'

import { problemResponse, type ProblemResponseOptions } from './problem'

type ValidationErrorLike = {
  issues: readonly ValidationIssueLike[]
}

type ValidationIssueLike = {
  message: string
  path: readonly unknown[]
}

type ValidationProblemOptions = Pick<ProblemResponseOptions, 'code' | 'detail' | 'title'>

export function zProblemValidator<
  Target extends keyof ValidationTargets,
  Schema extends Parameters<typeof zValidator>[1],
>(target: Target, schema: Schema, problem: ValidationProblemOptions = {}) {
  return zValidator(target, schema, (result, c) => {
    if (result.success) {
      return
    }

    return problemResponse(c, {
      status: 400,
      code: problem.code ?? 'invalid-input',
      detail: problem.detail ?? '입력을 확인해 주세요',
      title: problem.title,
      extensions: { invalidParams: getInvalidParams(result.error) },
    })
  })
}

function getInvalidParamName(issue: ValidationIssueLike): string | null {
  let name = ''

  for (const segment of issue.path) {
    if (typeof segment === 'number') {
      name += `[${segment}]`
      continue
    }

    if (typeof segment !== 'string' || segment.length === 0) {
      return null
    }

    name += name.length === 0 ? segment : `.${segment}`
  }

  return name.length > 0 ? name : null
}

function getInvalidParams(error: ValidationErrorLike): InvalidParam[] {
  const invalidParams = new Map<string, string>()

  for (const issue of error.issues) {
    const name = getInvalidParamName(issue)

    if (!name || invalidParams.has(name)) {
      continue
    }

    invalidParams.set(name, issue.message)
  }

  return Array.from(invalidParams, ([name, reason]) => ({ name, reason }))
}
