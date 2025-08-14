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
  const linkClassName =
    'bg-zinc-800 text-sm font-semibold rounded-full px-6 py-2 hover:bg-zinc-700 transition border border-zinc-700 inline-block'

  return (
    <main className="flex flex-col grow justify-center items-center gap-6 text-center px-4">
      <h1 className="text-2xl md:text-3xl font-bold">⚠️ 잘못된 검색 조건</h1>
      <p className="text-zinc-400">{message}</p>
      <div className="max-w-md space-y-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-left">
          <h2 className="font-semibold text-zinc-300 mb-2">검색 조건 가이드</h2>
          <ul className="text-zinc-400 text-sm space-y-2">
            <li>• 검색어: 최대 {MAX_SEARCH_QUERY_LENGTH}자까지 가능</li>
            <li>• 조회수/페이지: 1 ~ 10,000</li>
            <li>• 날짜 범위: 시작일이 종료일보다 이전이어야 함</li>
            <li>• 정렬: {validSortOptionsLabel} 중 선택</li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link className={linkClassName} href="/">
            홈으로 가기
          </Link>
          <Link className={linkClassName} href="/search">
            검색 조건 초기화
          </Link>
        </div>
      </div>
    </main>
  )
}
