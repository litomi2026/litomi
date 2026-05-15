import Link from 'next/link'

import { ProblemDetailsError } from '@/utils/react-query-error'

type Props = {
  error: unknown
  isRetrying: boolean
  onRetry: () => void
}

export default function SearchResultError({ error, isRetrying, onRetry }: Props) {
  const info = getSearchErrorInfo(error)
  const showMessage = Boolean(info.message && info.message.trim() !== info.title.trim())

  return (
    <main className="flex flex-col grow justify-center items-center gap-6 text-center px-4">
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl md:text-2xl font-semibold">{info.title}</h2>
        {showMessage ? (
          <p className="text-sm text-zinc-400">{info.message}</p>
        ) : (
          <p className="text-sm text-zinc-400">잠시 후 다시 시도해 주세요</p>
        )}
      </div>
      <div className="flex gap-3">
        {info.canRetry && (
          <button
            aria-disabled={isRetrying}
            className="rounded-full bg-zinc-800 px-6 py-2 text-sm font-medium transition hover:bg-zinc-700 aria-disabled:opacity-60"
            disabled={isRetrying}
            onClick={onRetry}
            type="button"
          >
            다시 시도
          </button>
        )}
        <Link
          className={
            info.canRetry
              ? 'rounded-full px-6 py-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-300'
              : 'rounded-full bg-zinc-800 px-6 py-2 text-sm font-medium transition hover:bg-zinc-700'
          }
          href="/search"
          prefetch={false}
        >
          검색 초기화
        </Link>
      </div>
    </main>
  )
}

function getSearchErrorInfo(error: unknown) {
  if (error instanceof ProblemDetailsError) {
    return {
      title: error.problem.title,
      message: error.problem.detail || '잠시 후 다시 시도해 주세요',
      canRetry: error.isRetryable,
    }
  }

  if (error instanceof Error) {
    return {
      title: '검색 중 오류가 발생했어요',
      message: error.message || '잠시 후 다시 시도해 주세요',
      canRetry: true,
    }
  }

  return {
    title: '검색 중 오류가 발생했어요',
    message: '잠시 후 다시 시도해 주세요',
    canRetry: true,
  }
}
