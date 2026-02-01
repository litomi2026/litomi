import Link from 'next/link'

export default function Unauthorized() {
  return (
    <div className="grid gap-6 p-8">
      <div className="max-w-2xl mx-auto w-full text-center">
        <h1 className="text-2xl font-semibold mb-4">로그인이 필요해요</h1>
        <p className="text-zinc-400 mb-6">내 기부 목록은 로그인한 사용자만 볼 수 있어요</p>
        <Link
          className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition"
          href="/auth/login"
        >
          로그인하기
        </Link>
      </div>
    </div>
  )
}
