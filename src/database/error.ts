export function isPostgresError(error: unknown): error is Error & { cause: { code: string; constraint_name: string } } {
  return (
    error instanceof Error &&
    'cause' in error &&
    error.cause !== null &&
    typeof error.cause === 'object' &&
    'code' in error.cause &&
    'constraint_name' in error.cause
  )
}
