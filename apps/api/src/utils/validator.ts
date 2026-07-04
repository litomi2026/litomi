import { zValidator } from '@hono/zod-validator'
import { PROBLEM, type ProblemSpec } from '@litomi/contracts'
import type { InvalidParam } from '@litomi/http/problem-details'
import type { ValidationTargets } from 'hono'

import { problemResponse } from './problem'

type ValidationErrorLike = {
  issues: readonly ValidationIssueLike[]
}

// Zod 이슈의 구조적 서브셋 — code/minimum/maximum은 이슈 종류에 따라서만 존재한다.
type ValidationIssueLike = {
  code?: string
  message: string
  path: readonly unknown[]
  params?: Record<string, unknown>
  minimum?: bigint | number
  maximum?: bigint | number
}

export function zProblemValidator<
  Target extends keyof ValidationTargets,
  Schema extends Parameters<typeof zValidator>[1],
>(target: Target, schema: Schema, spec: ProblemSpec = PROBLEM.INVALID_INPUT) {
  return zValidator(target, schema, (result, c) => {
    if (result.success) {
      return
    }

    return problemResponse(c, {
      problem: spec,
      extensions: { invalidParams: getInvalidParams(result.error) },
    })
  })
}

function getInvalidParamCode(issue: ValidationIssueLike): string {
  if (issue.code === 'custom' && typeof issue.params?.code === 'string') {
    return issue.params.code
  }

  return issue.code ?? 'custom'
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
  const invalidParams = new Map<string, InvalidParam>()

  for (const issue of error.issues) {
    const name = getInvalidParamName(issue)

    if (!name || invalidParams.has(name)) {
      continue
    }

    invalidParams.set(name, {
      name,
      code: getInvalidParamCode(issue),
      reason: issue.message,
      minimum: toFiniteNumber(issue.minimum),
      maximum: toFiniteNumber(issue.maximum),
    })
  }

  return Array.from(invalidParams.values())
}

function toFiniteNumber(value: bigint | number | undefined): number | undefined {
  if (value === undefined) {
    return undefined
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}
