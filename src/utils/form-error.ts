export type FormError = {
  form?: string
  fields?: Record<string, string>
}

export const FormErrors = {
  RATE_LIMITED: '너무 많은 시도가 있었어요',
  INVALID_INPUT: '입력 값이 유효하지 않아요',
} as const

export function createFormError(formError?: string, fieldErrors?: Record<string, string>): FormError {
  return {
    ...(formError && { form: formError }),
    ...(fieldErrors && { fields: fieldErrors }),
  }
}

export function getErrorMessage(error: FormError | undefined): string | undefined {
  if (!error) {
    return undefined
  }

  if (error.form) {
    return error.form
  }

  if (error.fields) {
    const fieldErrors = Object.values(error.fields)
    return fieldErrors[0]
  }

  return undefined
}

export function hasFieldError(error: FormError | undefined, field: string): boolean {
  return Boolean(error?.fields?.[field])
}

/**
 * Converts Zod validation errors to our FormError structure
 */
export function zodToFormError(zodError: Record<string, { errors: string[] }>): FormError {
  const fields: Record<string, string> = {}

  for (const [field, { errors }] of Object.entries(zodError)) {
    if (errors.length > 0) {
      fields[field] = errors[0]
    }
  }

  return createFormError(undefined, fields)
}
