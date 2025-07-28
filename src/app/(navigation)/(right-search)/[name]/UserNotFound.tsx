import Link from 'next/dist/client/link'

export default function UserNotFound() {
  return (
    <div className="flex flex-col justify-center items-center grow">
      <h1 className="mb-4 text-5xl md:text-6xl font-bold">404</h1>
      <h2 className="mb-8 text-xl md:text-2xl">존재하지 않는 사용자에요</h2>
      <div className="grid gap-2">
        <Link
          className="bg-zinc-700 rounded-full hover:bg-zinc-600 active:bg-zinc-700 px-4 py-2 transition ease-in-out"
          href="/"
        >
          홈으로 가기
        </Link>
      </div>
    </div>
  )
}
