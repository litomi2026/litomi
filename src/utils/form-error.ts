import 'server-only'
import z from 'zod'

export function flattenZodFieldErrors<T>(fieldErrors: z.ZodError<T>) {
  const flattenedErrors = z.flattenError(fieldErrors).fieldErrors
  const errors: { [P in keyof T]?: string | undefined } = {}

  for (const key in flattenedErrors) {
    const value = flattenedErrors[key as keyof typeof flattenedErrors]
    if (value?.[0]) {
      errors[key] = value[0]
    }
  }

  return errors
}
