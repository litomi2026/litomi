import Link from 'next/link'

import IconFingerprint from '@/components/icons/IconFingerprint'

export default function GuestView() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <IconFingerprint className="mb-6 h-24 w-24 text-zinc-700" />
      <h2 className="mb-3 text-2xl font-semibold">로그인이 필요해요</h2>
      <p className="mb-8 max-w-md text-center text-zinc-400">
        패스키를 등록하려면 먼저 로그인해주세요. 로그인 후 생체 인증으로 더 빠르고 안전하게 접속할 수 있어요.
      </p>
      <Link
        className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        href="/auth/login"
      >
        로그인하러 가기
      </Link>
    </div>
  )
}
