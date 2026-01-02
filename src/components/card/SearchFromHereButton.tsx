'use client'

import { Loader2, Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

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
    const params = new URLSearchParams(window.location.search)
    params.set('next-id', (mangaId + 1).toString())

    startTransition(() => {
      router.push(`/search?${params}`)
    })
  }, [mangaId, router])

  return (
    <button
      className={`flex justify-center items-center gap-1 ${className}`}
      disabled={isDisabled}
      onClick={handleSearchFromHere}
      title={isDefaultSort ? '이 작품부터 검색 결과를 다시 불러와요' : '기본순 정렬일 때만 사용할 수 있어요'}
      type="button"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4 shrink-0" />}
      <span className="text-sm font-medium whitespace-nowrap">
        <span>여기부터</span>
        <span className="hidden sm:inline"> 재검색</span>
      </span>
    </button>
  )
}
