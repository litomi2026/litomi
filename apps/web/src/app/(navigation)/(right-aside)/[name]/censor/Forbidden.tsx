import Link from 'next/link'

type Props = {
  loginUsername: string
}

export default function Forbidden({ loginUsername }: Props) {
  return (
    <div className="flex flex-col flex-1 items-center px-4 py-8 text-center max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">접근 권한이 없어요</h2>
      <p className="text-zinc-400 mb-6">본인의 검열 설정만 관리할 수 있어요</p>
      <Link
        className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition"
        href={`/@${loginUsername}/censor`}
        prefetch={false}
      >
        내 검열 설정으로 가기
      </Link>
    </div>
  )
}
