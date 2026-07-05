import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

import { Link } from '@/i18n/navigation'
import { type ErrorsTranslator, getErrorMessage } from '@/lib/error-message'
import { ProblemDetailsError } from '@/utils/fetch-response'

type Props = {
  error: unknown
  isRetrying: boolean
  onRetry: () => void
}

export default function SearchResultError({ error, isRetrying, onRetry }: Props) {
  const t = useTranslations('Search.resultError')
  const tErrors = useTranslations('Errors')
  const info = getSearchErrorInfo(error, tErrors)
  const title = t('fallbackTitle')
  const description = info.message && info.message.trim() !== title.trim() ? info.message : t('fallbackDescription')

  return (
    <main className="flex flex-col grow justify-center items-center gap-6 text-center px-4">
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <div className="flex gap-3">
        {info.canRetry && (
          <button
            className="rounded-full bg-zinc-800 px-6 py-2 text-sm font-medium transition hover:bg-zinc-700 disabled:opacity-60"
            disabled={isRetrying}
            onClick={onRetry}
            type="button"
          >
            {t('retry')}
          </button>
        )}
        <Link
          className={twMerge(
            'rounded-full px-6 py-2 text-sm font-medium transition',
            info.canRetry ? 'text-zinc-400 hover:text-zinc-300' : 'bg-zinc-800 hover:bg-zinc-700',
          )}
          href="/search"
          prefetch={false}
        >
          {t('reset')}
        </Link>
      </div>
    </main>
  )
}

function getSearchErrorInfo(error: unknown, t: ErrorsTranslator) {
  return {
    message: getErrorMessage(t, error) ?? undefined,
    canRetry: error instanceof ProblemDetailsError ? error.isRetryable : true,
  }
}
