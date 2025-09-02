import Link from 'next/link'

import IconBookmark from '@/components/icons/IconBookmark'
import LoginButton from '@/components/LoginButton'

export default function Unauthorized() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
      <div className="text-center max-w-md mx-auto">
        <div className="relative mb-8">
          <IconBookmark className="w-20 h-20 mx-auto text-zinc-700" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-200 mb-3">북마크 기능은 로그인이 필요해요</h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">계정을 만들고 마음에 드는 작품을 저장하세요</p>
        <ul className="mb-8 space-y-2.5 text-sm" role="list">
          <li className="flex justify-center items-center gap-2.5">
            <span className="text-brand-end">•</span>
            <span className="text-zinc-300">좋아하는 작품 저장하기</span>
          </li>
          <li className="flex justify-center items-center gap-2.5">
            <span className="text-brand-end">•</span>
            <span className="text-zinc-300">모든 기기에서 북마크 동기화</span>
          </li>
          <li className="flex justify-center items-center gap-2.5">
            <span className="text-brand-end">•</span>
            <span className="text-zinc-300">북마크 다운로드 및 백업</span>
          </li>
        </ul>
        <LoginButton>로그인하기</LoginButton>
        <p className="mt-6 text-sm text-zinc-500">
          처음이신가요?{' '}
          <Link className="text-zinc-300 underline hover:text-zinc-100 transition-colors" href={`/auth/signup`}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
