'use client'

import LoginPageLink from '@/components/LoginPageLink'

import { LIBO_PAGE_LAYOUT } from './sexFortuneStyles'

export function SexFortuneLoginGate() {
  return (
    <div className={LIBO_PAGE_LAYOUT.container}>
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-base font-semibold text-foreground">로그인이 필요해요</h2>
          <p className="mt-1 text-sm text-zinc-400">
            오늘의 야한 섹스 운세는 성인인증 후에만 볼 수 있어요. 로그인해서 뜨거운 운세를 확인해 주세요.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <LoginPageLink className="flex-1" title="로그인">
              <span className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90">
                로그인하고 보기
              </span>
            </LoginPageLink>
          </div>
        </div>
      </div>
    </div>
  )
}
