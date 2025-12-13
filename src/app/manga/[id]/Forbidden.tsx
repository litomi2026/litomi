import Link from 'next/link'

import IconShield from '@/components/icons/IconShield'

export default function Forbidden() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12 bg-linear-to-b from-background via-zinc-900/50 to-background">
      <div className="max-w-md w-full space-y-8">
        <div className="relative flex justify-center">
          <div className="absolute inset-0 flex justify-center">
            <div className="w-32 h-32 bg-linear-to-br from-red-900/20 via-red-800/10 to-transparent rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="relative">
            <div className="relative group">
              <div className="absolute -inset-4 bg-linear-to-r from-red-900/20 to-orange-900/20 rounded-full blur-xl group-hover:blur-2xl transition opacity-0 group-hover:opacity-100" />
              <div className="relative p-6 bg-zinc-900/50 backdrop-blur-sm rounded-full border border-zinc-800/50">
                <IconShield className="w-16 h-16 text-zinc-500 transition group-hover:text-zinc-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">접근 제한된 콘텐츠</h1>
          <p className="text-zinc-400 leading-relaxed max-w-sm mx-auto">
            이 작품은 커뮤니티 가이드라인 또는 법적 규정에 따라
            <br className="hidden sm:block" />
            현재 열람이 제한되어 있습니다
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-900 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-900/80" />
            </span>
            <span className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Restricted Access</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link
            className="flex items-center justify-center flex-1 px-6 py-3 bg-zinc-900/50 hover:bg-zinc-800/50 backdrop-blur-sm border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-300 font-medium transition"
            href="/new/1"
            prefetch={false}
          >
            신작 페이지
          </Link>
          <Link
            className="flex items-center justify-center flex-1 px-6 py-3 bg-linear-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600 rounded-lg text-zinc-100 font-medium transition hover:shadow-lg hover:shadow-zinc-900/50"
            href="/"
            prefetch={false}
          >
            홈으로 가기
          </Link>
        </div>
        <div className="pt-8 border-t border-zinc-800/30">
          <p className="text-center text-xs text-zinc-600">
            제한 사유에 대한 문의는{' '}
            <Link
              className="text-zinc-500 hover:text-zinc-400 underline underline-offset-2 transition-colors"
              href="/doc/terms"
              prefetch={false}
            >
              이용약관
            </Link>
            을 참고해 주세요
          </p>
        </div>
      </div>
    </div>
  )
}
