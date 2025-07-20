import Link from 'next/link'

import MangaCard from '@/components/card'
import IconBookmark from '@/components/icons/IconBookmark'
import LoginButton from '@/components/LoginButton'
import { SearchParamKey } from '@/constants/storage'
import { SourceParam } from '@/utils/param'

import { EXAMPLE_BOOKMARKED_MANGAS } from './constants'

export function GuestView() {
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-200px)] px-4 py-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <IconBookmark className="mb-6 w-16 h-16 mx-auto text-zinc-600" />
        <h2 className="text-zinc-400 text-base md:text-lg mb-8 leading-relaxed">
          마음에 드는 작품을 북마크에 추가하고, <br className="sm:hidden" />
          언제든지 다시 찾아볼 수 있어요
        </h2>
        <ul className="mb-8 space-y-3" role="list">
          <li className="flex justify-center items-center gap-3">
            <span aria-hidden="true" className="text-brand-end mt-0.5">
              ✓
            </span>
            <span className="text-zinc-300">좋아하는 작품 저장하기</span>
          </li>
          <li className="flex justify-center items-center gap-3">
            <span aria-hidden="true" className="text-brand-end mt-0.5">
              ✓
            </span>
            <span className="text-zinc-300">모든 기기에서 동기화</span>
          </li>
          <li className="flex justify-center items-center gap-3">
            <span aria-hidden="true" className="text-brand-end mt-0.5">
              ✓
            </span>
            <span className="text-zinc-300">읽은 작품 히스토리 관리</span>
          </li>
        </ul>
        <LoginButton redirect="/@/bookmark">로그인하고 시작하기</LoginButton>
        <p className="mt-4 text-sm text-zinc-500">
          계정이 없으신가요?{' '}
          <Link
            className="text-zinc-300 underline hover:text-white transition"
            href={`/auth/signup?${SearchParamKey.REDIRECT}=${encodeURIComponent('/@/bookmark')}`}
          >
            회원가입
          </Link>
        </p>
      </div>
      <div className="w-full max-w-4xl mx-auto">
        <div className="relative mb-8">
          <hr className="border-zinc-800" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 px-4 text-sm text-zinc-500">
            예시 작품
          </span>
        </div>
        <ul className="grid gap-2 md:grid-cols-2 opacity-60 hover:opacity-80 transition" role="list">
          {EXAMPLE_BOOKMARKED_MANGAS.map((manga) => (
            <MangaCard key={manga.id} manga={manga} source={SourceParam.K_HENTAI} />
          ))}
        </ul>
      </div>
    </div>
  )
}
