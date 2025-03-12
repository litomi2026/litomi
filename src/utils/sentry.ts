import * as Sentry from '@sentry/nextjs'

export async function sendError() {
  await Sentry.startSpan(
    {
      name: 'Example Frontend Span',
      op: 'test',
    },
    async () => {
      const res = await fetch('/api/sentry-example-api')
      if (!res.ok) {
        throw new Error('Sentry Example Frontend Error')
      }
    },
  )
}
