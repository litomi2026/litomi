import { MAX_SEARCH_QUERY_LENGTH } from '@litomi/domain/search/policy'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

type Props = {
  message: string
}

export default function Error400({ message }: Props) {
  const t = useTranslations('Search.error400')
  const sortT = useTranslations('Search.filter.sortOptions')
  const validSortOptionsLabel = [sortT('latest'), sortT('popular'), sortT('random'), sortT('oldest')].join(', ')

  return (
    <main className="flex flex-col grow justify-center items-center gap-8 text-center px-4">
      <div className="space-y-3 max-w-md">
        <h1 className="text-xl md:text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
      <ul className="text-left max-w-sm space-y-2 text-xs text-zinc-500 list-disc list-inside">
        <li>{t('queryRule', { count: MAX_SEARCH_QUERY_LENGTH })}</li>
        <li>{t('rangeRule')}</li>
        <li>{t('dateRule')}</li>
        <li>{t('sortRule', { options: validSortOptionsLabel })}</li>
      </ul>
      <div className="flex gap-3">
        <Link
          className="rounded-full bg-zinc-800 px-6 py-2 text-sm font-medium transition hover:bg-zinc-700"
          href="/search"
          prefetch={false}
        >
          {t('retrySearch')}
        </Link>
        <Link
          className="rounded-full px-6 py-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-300"
          href="/"
          prefetch={false}
        >
          {t('home')}
        </Link>
      </div>
    </main>
  )
}
