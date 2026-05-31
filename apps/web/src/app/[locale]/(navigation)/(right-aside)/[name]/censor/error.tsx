'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { toast } from 'sonner'

import type { ErrorProps } from '@/types/nextjs'

import { useRouter } from '@/i18n/navigation'

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations('Censorship')
  const router = useRouter()

  useEffect(() => {
    if (error.message) {
      toast.error(t('error.toast'))
    }
  }, [error.message, t])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">{t('error.title')}</h2>
      <p className="text-zinc-500">{t('error.description')}</p>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition" onClick={() => reset()}>
          {t('error.retry')}
        </button>
        <button className="px-4 py-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition" onClick={() => router.back()}>
          {t('error.back')}
        </button>
      </div>
    </div>
  )
}
