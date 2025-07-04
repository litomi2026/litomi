import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-col grow justify-center items-center gap-6 text-center px-4">
      <h1 className="text-2xl md:text-3xl font-bold">⚠️ 잘못된 검색 조건</h1>
      <div className="max-w-md space-y-4">
        <p className="text-zinc-400">입력하신 검색 조건이 올바르지 않습니다.</p>
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-left">
          <h2 className="font-semibold text-zinc-300 mb-2">검색 조건 가이드</h2>
          <ul className="text-zinc-400 text-sm space-y-2">
            <li>• 검색어: 최대 500자까지 입력 가능</li>
            <li>• 조회수/페이지: 양수만 입력 가능</li>
            <li>• 페이지 수: 1 ~10,000 범위</li>
            <li>• 날짜 범위: 시작일이 종료일보다 이전이어야 함</li>
            <li>• 정렬: random, id_asc, popular 중 선택</li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            className="bg-zinc-800 text-sm font-semibold rounded-full px-6 py-2 hover:bg-zinc-700 transition border border-zinc-700 inline-block"
            href="/"
          >
            홈으로 가기
          </Link>
        </div>
      </div>
    </main>
  )
}
