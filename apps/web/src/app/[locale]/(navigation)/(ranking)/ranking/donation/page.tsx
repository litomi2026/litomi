import type { PublicLocale } from '@litomi/domain/locale'
import { formatNumber } from '@litomi/std'
import { Heart } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { SearchParam as SearchPageSearchParam } from '@/app/[locale]/(navigation)/search/constants'
import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import { getDonationRanking } from './query'

export const revalidate = 43200 // 12 hours

export async function generateMetadata({ params }: PageProps<'/[locale]/ranking/donation'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.ranking.donation' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/ranking/donation',
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/ranking/donation'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'RankingDonationPage' })

  return (
    <div className="p-2">
      <JuicyAdsBanner className="mb-2" />
      <details className="max-w-3xl mx-auto m-4 rounded-xl bg-white/4 border border-white/7">
        <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-2 text-sm text-zinc-200 [&::-webkit-details-marker]:hidden">
          <Heart className="size-4 text-zinc-400" />
          <span className="font-medium">{t('summaryTitle')}</span>
          <span className="ml-auto text-xs text-zinc-500">{t('detailsLabel')}</span>
        </summary>
        <div className="px-4 pb-4 text-sm text-zinc-400">{t('summaryDescription')}</div>
      </details>
      <div className="max-w-3xl mx-auto grid gap-4 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800">
        <table className="w-full">
          <thead className="border-b border-zinc-800 whitespace-nowrap">
            <tr>
              <th className="p-4 py-3 text-left text-sm font-medium text-zinc-400">{t('rankColumn')}</th>
              <th className="py-3 text-left text-sm font-medium text-zinc-400">{t('recipientColumn')}</th>
              <th className="p-4 py-3 text-right text-sm font-medium text-zinc-400">{t('totalColumn')}</th>
            </tr>
          </thead>
          <DonationRankingBody locale={locale} />
        </table>
      </div>
    </div>
  )
}

async function DonationRankingBody({ locale }: { locale: PublicLocale }) {
  const t = await getTranslations({ locale, namespace: 'RankingDonationPage' })
  const items = await getDonationRanking(locale)

  return (
    <tbody>
      {items.map((item, index) => (
        <tr
          className="border-b border-zinc-800 last:border-b-0 transition hover:bg-zinc-800/50"
          key={`${item.type}:${item.value}`}
        >
          <td className="p-4 py-3 text-sm">
            <span className="font-semibold text-zinc-400">#{index + 1}</span>
          </td>
          <td className="p-0">
            <Link
              className="flex items-center gap-2 min-w-0 px-4 py-3 hover:underline"
              href={`/search?${new URLSearchParams({ [SearchPageSearchParam.QUERY]: `${item.type}:${item.value}` })}`}
              prefetch={false}
              title={t('searchTitle')}
            >
              <span className="text-xs text-zinc-500 shrink-0">
                {item.type === 'artist' ? t('artistType') : t('groupType')}
              </span>
              <span className="text-sm font-medium text-foreground line-clamp-1">{item.label}</span>
            </Link>
          </td>
          <td className="p-4 py-3 text-right">
            <span className="text-sm font-semibold text-brand tabular-nums">
              {t('liboAmount', { amount: formatNumber(item.totalReceived, locale) })}
            </span>
          </td>
        </tr>
      ))}
      {items.length === 0 && (
        <tr>
          <td className="p-6 text-sm text-zinc-500" colSpan={3}>
            {t('empty')}
          </td>
        </tr>
      )}
    </tbody>
  )
}
