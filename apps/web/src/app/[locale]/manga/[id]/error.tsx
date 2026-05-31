'use client'

import { captureException } from '@sentry/nextjs'
import { TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import useCooldown from '@/hook/useCooldown'
import { usePathname } from '@/i18n/navigation'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: Props) {
  const pathname = usePathname()
  const cooldown = useCooldown()
  const t = useTranslations('MangaViewer.error')

  useEffect(() => {
    captureException(error, {
      tags: { error_boundary: pathname },
      extra: { pathname },
    })
  }, [error, pathname])

  return (
    <main className="flex flex-col justify-center items-center gap-6 text-center h-dvh">
      <h1 className="flex items-center justify-center gap-2 text-xl md:text-2xl">
        <TriangleAlert aria-hidden className="size-6 shrink-0 text-amber-400" />
        {t('title')}
      </h1>
      <div className="grid gap-2">
        <span className="text-sm">{error.digest}</span>
        <p className="text-red-600">{error.message}</p>
      </div>
      <button
        className="bg-zinc-700 rounded-full min-w-50 hover:bg-zinc-600 active:bg-zinc-700 px-4 py-2 transition disabled:bg-zinc-600 disabled:text-zinc-400"
        disabled={cooldown > 0}
        onClick={reset}
      >
        {cooldown > 0 ? t('retryWithCooldown', { seconds: cooldown / 1000 }) : t('retry')}
      </button>
    </main>
  )
}
