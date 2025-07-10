'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

import IconSearch from '../icons/IconSearch'
import IconSpinner from '../icons/IconSpinner'

type Props = {
  mangaId: number
  className?: string
}

export default function SearchFromHereButton({ mangaId, className = '' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const isLoading = isPending

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
      disabled={isLoading}
      onClick={handleSearchFromHere}
      title="이 작품 ID부터 검색 결과를 다시 불러옵니다"
      type="button"
    >
      {isLoading ? <IconSpinner className="w-4" /> : <IconSearch className="w-4 flex-shrink-0" />}
      <span className="text-sm font-medium whitespace-nowrap">
        <span className="hidden sm:inline">여기부터 재검색</span>
        <span className="sm:hidden">여기부터</span>
      </span>
    </button>
  )
}
