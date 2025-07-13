'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

import IconSearch from '../icons/IconSearch'
import IconSpinner from '../icons/IconSpinner'

type Props = {
  mangaId: number
  className?: string
}

export default function SearchFromHereButton({ mangaId, className = '' }: Readonly<Props>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const isDefaultSort = !searchParams.get('sort')
  const isDisabled = !isDefaultSort || isPending

  const handleSearchFromHere = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.set('next-id', mangaId.toString())

    startTransition(() => {
      router.push(`/search?${params}`)
    })
  }, [mangaId, router, searchParams])

  return (
    <button
      className={`flex justify-center items-center gap-1 ${className}`}
      disabled={isDisabled}
      onClick={handleSearchFromHere}
      title={isDefaultSort ? '이 다음 작품부터 검색 결과를 다시 불러옵니다' : '기본순 정렬일 때만 사용할 수 있어요.'}
      type="button"
    >
      {isPending ? <IconSpinner className="w-4" /> : <IconSearch className="w-4 flex-shrink-0" />}
      <span className="text-sm font-medium whitespace-nowrap">
        <span>이 다음부터</span>
        <span className="hidden sm:inline"> 재검색</span>
      </span>
    </button>
  )
}
