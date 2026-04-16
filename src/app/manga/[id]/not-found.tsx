import { SearchX } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-col justify-center items-center h-dvh">
      <h1 className="mb-4 text-5xl md:text-6xl font-bold">404</h1>
      <h2 className="mb-8 inline-flex items-center gap-2 text-xl md:text-2xl">
        <span>작품을 찾을 수 없어요</span>
        <SearchX aria-hidden className="size-6 shrink-0 text-zinc-400" />
      </h2>
      <div className="grid gap-2">
        <Link
          className="bg-zinc-700 rounded-full hover:bg-zinc-600 active:bg-zinc-700 px-4 py-2 transition ease-in-out"
          href="/manga/3594757"
        >
          다른 작품 보러가기
        </Link>
      </div>
    </main>
  )
}
