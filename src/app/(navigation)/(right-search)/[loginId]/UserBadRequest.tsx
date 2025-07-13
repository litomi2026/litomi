import Link from 'next/link'

export default function UserBadRequest() {
  return (
    <div className="flex flex-col justify-center items-center grow">
      <h1 className="mb-4 text-5xl md:text-6xl font-bold">400</h1>
      <h2 className="mb-8 text-xl md:text-2xl">잘못된 요청이에요</h2>
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
