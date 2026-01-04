import Link from 'next/link'

export default function Header1() {
  return (
    <header className="space-y-2">
      <Link
        className="inline-flex text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
        href="/webtoon"
        prefetch={false}
      >
        ← 돌아가기
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">이용약관</h1>
        <p className="mt-1 text-sm text-zinc-400">리토미 서비스 이용에 관한 약관입니다.</p>
      </div>
    </header>
  )
}
