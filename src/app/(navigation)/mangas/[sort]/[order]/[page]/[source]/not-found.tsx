import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="h-full m-10 flex flex-col items-center justify-center">
      <h1 className="mb-4 text-6xl font-bold">404</h1>
      <p className="mb-8 text-2xl">만화가 없어요</p>
      <div className="grid gap-2">
        <Link
          className="bg-zinc-700 hover:bg-zinc-600 font-semibold active:bg-zinc-700 rounded-full px-4 py-2 transition duration-300 ease-in-out"
          href="/mangas/id/desc/1/hi"
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}
