import Link from 'next/link'

type Props = {
  loginUsername: string
}

export default function Forbidden({ loginUsername }: Readonly<Props>) {
  return (
    <div className="grid gap-6 p-8">
      <div className="max-w-2xl mx-auto w-full text-center">
        <h1 className="text-2xl font-semibold mb-4">접근 권한이 없어요</h1>
        <p className="text-zinc-400 mb-6">본인의 내 기부 페이지만 접근할 수 있어요</p>
        <Link
          className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition"
          href={`/@${loginUsername}/donations`}
          prefetch={false}
        >
          내 기부로 가기
        </Link>
      </div>
    </div>
  )
}

