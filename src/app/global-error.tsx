'use client'

import type { ErrorProps } from '@/types/nextjs'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error)
    }
  }, [error])

  return (
    <html>
      <body className="flex items-center justify-center p-2 h-dvh">
        <main className="max-w-prose text-center">
          <h2 className="my-8 gap-2 text-2xl">문제가 발생했어요</h2>
          <span className="text-sm">digest: {error.digest}</span>
          <p className="my-2 text-red-500">{error.message}</p>
          <p className="my-2 break-keep text-sm text-gray-500">문제가 계속되면</p>
          <button
            className="transition mx-auto my-6 flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-green-800 px-4 py-2 text-sm text-foreground border-2 border-green-700 hover:bg-green-700 active:bg-green-900"
            onClick={() => reset()}
          >
            다시 시도하기
          </button>
        </main>
      </body>
    </html>
  )
}
