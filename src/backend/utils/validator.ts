import type { ValidationTargets } from 'hono'

import { zValidator } from '@hono/zod-validator'

import { problemResponse } from './problem'

type ValidationOptions = {
  detail?: string
}

export function zProblemValidator<
  Target extends keyof ValidationTargets,
  Schema extends Parameters<typeof zValidator>[1],
>(target: Target, schema: Schema, options?: ValidationOptions) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return problemResponse(c, { status: 400, detail: options?.detail })
    }
  })
}
