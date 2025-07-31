import z from 'zod/v4'

export function flattenZodFieldErrors<T>(fieldErrors: z.ZodError<T>): Record<string, string> {
  const flattenedErrors = z.flattenError(fieldErrors).fieldErrors
  const errors: Record<string, string> = {}

  for (const key in flattenedErrors) {
    const value = flattenedErrors[key as keyof typeof flattenedErrors]
    if (value?.[0]) {
      errors[key] = value[0]
    }
  }

  return errors
}
