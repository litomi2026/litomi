'use client'

import { captureException } from '@sentry/nextjs'
import { TriangleAlert } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import useCooldown from '@/hook/useCooldown'
import { usePathname, useRouter } from '@/i18n/navigation'

import { SearchHeaderSpacer } from './SearchHeaderSpacer'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: Props) {
  const t = useTranslations('Search.errorBoundary')
  const cooldown = useCooldown()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    captureException(error, {
      tags: { error_boundary: pathname },
      extra: { searchParams: Object.fromEntries(searchParams) },
    })
  }, [error, pathname, searchParams])

  const getErrorMessage = () => {
    if (error.message.includes('429')) {
      return t('rateLimited')
    }
    if (error.message.includes('500')) {
      return t('serverError')
    }
    if (error.message.includes('503')) {
      return t('maintenance')
    }
    return error.message || t('unknown')
  }

  return (
    <>
      <SearchHeaderSpacer />
      <main className="flex flex-col grow justify-center items-center gap-6 text-center px-4">
        <h1 className="flex items-center justify-center gap-2 text-xl md:text-2xl">
          <TriangleAlert aria-hidden className="size-6 shrink-0 text-amber-400" />
          {t('title')}
        </h1>
        <div className="grid gap-2 max-w-md">
          {error.digest && <span className="text-sm text-zinc-500">{t('errorCode', { digest: error.digest })}</span>}
          <p className="text-red-400">{getErrorMessage()}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-zinc-700 text-sm font-semibold rounded-full min-w-40 hover:bg-zinc-600 active:bg-zinc-700 px-4 py-2 transition disabled:bg-zinc-600 disabled:text-zinc-400"
            disabled={cooldown > 0}
            onClick={reset}
          >
            {cooldown > 0 ? t('retryWithCooldown', { seconds: cooldown / 1000 }) : t('retry')}
          </button>
          <button
            className="bg-zinc-800 text-sm font-semibold rounded-full min-w-40 hover:bg-zinc-700 active:bg-zinc-800 px-4 py-2 transition border border-zinc-700"
            onClick={() => router.replace('/search')}
          >
            {t('reset')}
          </button>
        </div>
      </main>
      <MobileNavigationSpacer />
    </>
  )
}
