'use client'

import './globals.css'

import { DEFAULT_LOCALE, isPublicLocale } from '@litomi/domain/locale'
import { env } from '@litomi/env/client'
import * as Sentry from '@sentry/nextjs'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import CloudProviderStatus from '@/components/CloudProviderStatus'
import ErrorDiagnosticDetails from '@/components/ErrorDiagnosticDetails'
import RetryGuidance from '@/components/RetryGuidance'
import type { ErrorProps } from '@/types/nextjs'
import { reloadIfStaleDeployment } from '@/utils/stale-deployment'

export default function GlobalError({ error }: ErrorProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname)
  const [hasSystemIssues, setHasSystemIssues] = useState(false)

  useEffect(() => {
    if (reloadIfStaleDeployment(error)) {
      return
    }

    Sentry.captureException(error, {
      tags: {
        appEnvironment: env.NEXT_PUBLIC_APP_ENV,
        deployment_id: env.NEXT_PUBLIC_COMMIT_SHA,
        error_boundary: pathname,
      },
      extra: {
        searchParams: Object.fromEntries(searchParams),
      },
    })
  }, [error, pathname, searchParams])

  return (
    <html lang={locale}>
      <body className="flex items-center justify-center p-4 h-dvh bg-background">
        <main className="max-w-lg text-center text-foreground">
          <h2 className="my-8 text-2xl font-medium">문제가 발생했어요</h2>
          <p className="text-sm text-red-400 my-4 break-all">{error.message}</p>
          <RetryGuidance errorMessage={error.message} hasSystemIssues={hasSystemIssues} />
          <CloudProviderStatus locale={locale} onStatusUpdate={setHasSystemIssues} />
          <ErrorDiagnosticDetails digest={error.digest} pathname={pathname} />
          <p className="my-4 break-keep text-sm text-zinc-400">
            문제가 계속되면{' '}
            <a
              className="underline decoration-dotted underline-offset-4"
              href="https://discord.gg/7c7kSQ9Byy"
              target="_blank"
              rel="noopener"
            >
              Discord
            </a>{' '}
            에 남겨주세요
          </p>
          <button
            type="button"
            className="transition mx-auto mt-6 mb-4 flex w-full max-w-xs items-center justify-center gap-2 whitespace-nowrap rounded-full bg-zinc-800 px-6 py-3 text-sm font-medium text-foreground hover:bg-zinc-700 active:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-background"
            onClick={() => window.location.reload()}
          >
            다시 시도하기
          </button>
        </main>
      </body>
    </html>
  )
}

function getLocaleFromPathname(pathname: string | null) {
  const firstPathSegment = pathname?.split('/')[1] ?? ''
  return isPublicLocale(firstPathSegment) ? firstPathSegment : DEFAULT_LOCALE
}
