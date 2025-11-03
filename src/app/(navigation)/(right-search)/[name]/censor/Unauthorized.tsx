import Link from 'next/link'

import IconX from '@/components/icons/IconX'
import LoginButton from '@/components/LoginButton'
import { SearchParamKey } from '@/constants/storage'

export default function Unauthorized() {
  return (
    <div className="flex flex-col flex-1 items-center px-4 py-8">
      <div className="text-center max-w-2xl mx-auto">
        <IconX className="mb-6 w-16 h-16 mx-auto text-zinc-600" />
        <h2 className="text-zinc-400 text-base md:text-lg mb-8 leading-relaxed">
          보고 싶지 않은 작품을 필터링해서, <br className="sm:hidden" />
          편안한 탐색 환경을 만들어보세요
        </h2>
        <ul className="mb-8 space-y-3" role="list">
          <li className="flex justify-center items-center gap-3">
            <span aria-hidden="true" className="text-brand mt-0.5">
              ✓
            </span>
            <span className="text-zinc-300">태그, 작가, 캐릭터별 필터링</span>
          </li>
          <li className="flex justify-center items-center gap-3">
            <span aria-hidden="true" className="text-brand mt-0.5">
              ✓
            </span>
            <span className="text-zinc-300">썸네일 블러 처리 또는 완전히 숨기기</span>
          </li>
          <li className="flex justify-center items-center gap-3">
            <span aria-hidden="true" className="text-brand mt-0.5">
              ✓
            </span>
            <span className="text-zinc-300">모든 기기에서 설정 동기화</span>
          </li>
        </ul>
        <LoginButton>로그인하고 시작하기</LoginButton>
        <p className="mt-4 text-sm text-zinc-500">
          계정이 없으신가요?{' '}
          <Link
            className="text-zinc-300 underline hover:text-foreground transition"
            href={`/auth/signup?${SearchParamKey.REDIRECT}=${encodeURIComponent('/@/censor')}`}
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
