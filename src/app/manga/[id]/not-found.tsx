import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-col justify-center items-center h-dvh">
      <h1 className="mb-4 text-5xl md:text-6xl font-bold">404</h1>
      <h2 className="mb-8 text-xl md:text-2xl">작품을 찾을 수 없어요 👀</h2>
      <div className="grid gap-2">
        <Link
          className="bg-zinc-700 rounded-full hover:bg-zinc-600 active:bg-zinc-700 px-4 py-2 transition ease-in-out"
          href="/mangas/1/hi/card"
          prefetch={false}
        >
          다른 작품 보러가기
        </Link>
      </div>
    </main>
  )
}
