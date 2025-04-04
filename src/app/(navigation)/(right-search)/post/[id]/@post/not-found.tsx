import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="col-span-full m-10 flex min-h-[50vh] flex-col items-center justify-center text-gray-900 lg:min-w-[65ch] dark:text-white">
      <h1 className="mb-4 text-6xl font-bold">404</h1>
      <p className="mb-8 text-2xl">게시글이 존재하지 않아요</p>
      <div className="grid gap-2">
        <Link
          className="bg-zinc-700 rounded-full hover:bg-zinc-600 active:bg-zinc-700 px-4 py-2  transition duration-300 ease-in-out"
          href="/"
        >
          처음으로 가기
        </Link>
      </div>
    </div>
  )
}
