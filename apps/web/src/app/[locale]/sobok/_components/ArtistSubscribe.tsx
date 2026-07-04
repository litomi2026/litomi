'use client'

import type { ChatArtistBrief, ChatArtistPrice } from '@litomi/contracts'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { formatPrice } from '../_lib/format'

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
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 shrink-0 flex items-center px-2 border-b border-foreground/10">
        <Link href="/sobok" className="p-2 text-zinc-400 hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-linear-to-br from-indigo-500/30 to-indigo-500/5 flex items-center justify-center text-4xl">
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

            <button
              type="button"
              onClick={onSubscribe}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 py-3.5 font-semibold text-white transition-colors hover:bg-indigo-400 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {lapsed ? t('resubscribe') : t('subscribeCta', { price: formatPrice(price, locale) })}
            </button>

            <p className="text-[11px] text-zinc-500">{t('autoRenewNotice')}</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">{t('notOpen')}</p>
        )}
      </div>
    </div>
  )
}
