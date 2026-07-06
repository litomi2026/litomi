'use client'

import type { ChatArtistBrief, ChatArtistPrice } from '@litomi/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { formatPrice } from '../_lib/format'
import Button from './ui/Button'
import PageHeader, { HeaderBackLink } from './ui/PageHeader'

interface Props {
  artist: ChatArtistBrief
  price: ChatArtistPrice | undefined
  onSubscribe: () => void
  isPending: boolean
  error: string | null
  // Lapsed = re-subscribe copy (the fan has a past subscription).
  lapsed?: boolean
}

export default function ArtistSubscribe({ artist, price, onSubscribe, isPending, error, lapsed }: Props) {
  const t = useTranslations('Sobok.subscribe')
  const locale = useLocale()

  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader back={<HeaderBackLink className="lg:hidden" href="/sobok" />} title={null} />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-indigo-500/30 to-indigo-500/5 text-4xl">
          {artist.emoji ?? artist.displayName.charAt(0)}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{artist.displayName}</h1>
          {artist.description && (
            <p className="max-w-sm whitespace-pre-wrap text-sm text-zinc-400">{artist.description}</p>
          )}
        </div>

        {price ? (
          <div className="w-full max-w-sm space-y-4">
            <div className="rounded-2xl border border-foreground/10 bg-zinc-800/60 p-5">
              <p className="text-sm text-zinc-400">{t('monthly')}</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{formatPrice(price, locale)}</p>
              <p className="mt-2 text-xs text-zinc-500">{t('pitch', { name: artist.displayName })}</p>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button busy={isPending} className="w-full rounded-2xl py-3.5 text-base" onClick={onSubscribe}>
              {lapsed ? t('resubscribe') : t('subscribeCta', { price: formatPrice(price, locale) })}
            </Button>

            <p className="text-[11px] text-zinc-500">{t('autoRenewNotice')}</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">{t('notOpen')}</p>
        )}
      </div>
    </div>
  )
}
