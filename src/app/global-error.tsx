'use client'

import type { ErrorProps } from '@/types/nextjs'

import NextError from 'next/error'

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <html>
      <body className="flex items-center justify-center">
        <h2 className="my-8 gap-2 text-2xl">문제가 발생했어요</h2>
        <span className="text-sm">{error.digest}</span>
        <p className="my-2 text-red-600">{error.message}</p>
        <p className="my-2 break-keep text-sm text-gray-500">문제가 계속되면 ...</p>
        <button
          className="transition-color mx-auto my-6 flex w-full max-w-md items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-red-200 px-4 py-2 text-sm text-red-800 duration-300 hover:bg-red-300"
          onClick={() => reset()}
        >
          다시 시도하기
        </button>

        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
