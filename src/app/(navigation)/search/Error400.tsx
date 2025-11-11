import Link from 'next/link'

import { MAX_SEARCH_QUERY_LENGTH } from '@/constants/policy'

import { FILTER_CONFIG } from './constants'

const validSortOptionsLabel = Object.values(FILTER_CONFIG.sort.options)
  .map((option) => option.label)
  .join(', ')

type Props = {
  message: string
}

export default function Error400({ message }: Readonly<Props>) {
  return (
    <main className="flex flex-col grow justify-center items-center gap-8 text-center px-4">
      <div className="space-y-3 max-w-md">
        <h1 className="text-xl md:text-2xl font-semibold">잘못된 검색 조건</h1>
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
      <ul className="text-left max-w-sm space-y-2 text-xs text-zinc-500 list-disc list-inside">
        <li>검색어: 최대 {MAX_SEARCH_QUERY_LENGTH}자</li>
        <li>조회수/페이지: 1 ~ 10,000</li>
        <li>날짜 범위: 시작일 ≤ 종료일</li>
        <li>정렬: {validSortOptionsLabel}</li>
      </ul>
      <div className="flex gap-3">
        <Link
          className="rounded-full bg-zinc-800 px-6 py-2 text-sm font-medium transition hover:bg-zinc-700"
          href="/search"
        >
          검색 다시하기
        </Link>
        <Link
          className="rounded-full px-6 py-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-300"
          href="/"
        >
          홈으로
        </Link>
      </div>
    </main>
  )
}
