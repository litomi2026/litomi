import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] grow border-2 rounded-xl">
      <h2 className="mb-8 text-xl md:text-2xl">북마크가 없어요 👀</h2>
      <div className="grid gap-2">
        <Link
          className="bg-zinc-700 rounded-full hover:bg-zinc-600 active:bg-zinc-700 px-4 py-2 transition ease-in-out"
          href="../mangas/id/desc/1/hi"
        >
          북마크하러 가기
        </Link>
      </div>
    </div>
  )
}
