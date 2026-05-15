import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col grow items-center justify-center p-10">
      <h1 className="mb-4 text-6xl font-bold">404</h1>
      <p className="mb-8 text-2xl">작품이 없어요</p>
      <div className="grid gap-2">
        <Link
          className="bg-zinc-700 text-sm hover:bg-zinc-600 font-semibold active:bg-zinc-700 rounded-full px-4 py-2 transition ease-in-out"
          href="/new/1"
          prefetch={false}
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}
