'use client'

import * as Sentry from '@sentry/nextjs'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { ErrorProps } from '@/types/nextjs'

import CloudProviderStatus from '@/components/CloudProviderStatus'
import RetryGuidance from '@/components/RetryGuidance'

export default function GlobalError({ error, reset }: ErrorProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hasSystemIssues, setHasSystemIssues] = useState(false)

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { error_boundary: pathname },
      extra: { searchParams: Object.fromEntries(searchParams) },
    })
  }, [error, pathname, searchParams])

  return (
    <html lang="ko">
      <body className="flex items-center justify-center p-4 h-dvh bg-background">
        <main className="max-w-prose text-center text-foreground">
          <h2 className="my-8 text-2xl font-medium">문제가 발생했어요</h2>
          <div className="space-y-2">
            {error.digest && <p className="text-xs text-zinc-500">오류 코드: {error.digest}</p>}
          </div>
          <p className="text-sm text-red-400 my-4 max-w-prose break-all">{error.message}</p>
          <RetryGuidance errorMessage={error.message} hasSystemIssues={hasSystemIssues} />
          <CloudProviderStatus onStatusUpdate={setHasSystemIssues} />
          <p className="my-4 break-keep text-sm text-zinc-400">
            문제가 계속되면{' '}
            <a
              className="underline decoration-dotted underline-offset-4"
              href="https://discord.gg/HRWrV6u6Hw"
              target="_blank"
            >
              Discord
            </a>{' '}
            또는{' '}
            <a
              className="underline decoration-dotted underline-offset-4"
              href="https://github.com/gwak2837/litomi/issues"
              target="_blank"
            >
              GitHub
            </a>{' '}
            에 남겨주세요
          </p>
          <button
            className="transition mx-auto mt-6 mb-4 flex w-full max-w-xs items-center justify-center gap-2 whitespace-nowrap rounded-full bg-zinc-800 px-6 py-3 text-sm font-medium text-foreground hover:bg-zinc-700 active:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-background"
            onClick={() => reset()}
          >
            다시 시도하기
          </button>
        </main>
      </body>
    </html>
  )
}
