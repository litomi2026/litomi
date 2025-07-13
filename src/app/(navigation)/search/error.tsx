'use client'

import { captureException } from '@sentry/nextjs'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import useCooldown from '@/hook/useCooldown'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: Readonly<Props>) {
  const cooldown = useCooldown()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    captureException(error, {
      tags: { error_boundary: pathname },
      extra: { searchParams: Object.fromEntries(searchParams) },
    })
  }, [error, pathname, searchParams])

  const getErrorMessage = () => {
    if (error.message.includes('429')) {
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    }
    if (error.message.includes('500')) {
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
    if (error.message.includes('503')) {
      return '서버 점검 중입니다. 잠시 후 다시 시도해주세요.'
    }
    return error.message || '알 수 없는 오류가 발생했습니다.'
  }

  return (
    <main className="flex flex-col grow justify-center items-center gap-6 text-center px-4">
      <h1 className="text-xl md:text-2xl">⚠️ 검색 중 오류가 발생했어요</h1>
      <div className="grid gap-2 max-w-md">
        {error.digest && <span className="text-sm text-zinc-500">오류 코드: {error.digest}</span>}
        <p className="text-red-400">{getErrorMessage()}</p>
      </div>
      <div className="flex gap-2">
        <button
          className="bg-zinc-700 text-sm font-semibold rounded-full min-w-40 hover:bg-zinc-600 active:bg-zinc-700 px-4 py-2 transition disabled:bg-zinc-600 disabled:text-zinc-400 disabled:pointer-events-none"
          disabled={cooldown > 0}
          onClick={reset}
        >
          다시 시도하기 {cooldown > 0 && `(${cooldown / 1000}초)`}
        </button>
        <button
          className="bg-zinc-800 text-sm font-semibold rounded-full min-w-40 hover:bg-zinc-700 active:bg-zinc-800 px-4 py-2 transition border border-zinc-700"
          onClick={() => (window.location.href = '/search')}
        >
          검색 조건 초기화
        </button>
      </div>
    </main>
  )
}
