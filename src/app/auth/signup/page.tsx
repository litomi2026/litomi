import { Metadata } from 'next'
import Link from 'next/link'

import IconLogo from '@/components/icons/IconLogo'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'

import SignupForm from './SignupForm'

export const metadata: Metadata = {
  title: '회원가입',
  openGraph: {
    ...defaultOpenGraph,
    title: `회원가입 - ${SHORT_NAME}`,
    url: '/auth/signup',
  },
  alternates: {
    canonical: '/auth/signup',
    languages: { ko: '/auth/signup' },
  },
}

export default function Page() {
  return (
    <main className="flex justify-center items-center min-h-full p-4">
      <h1 className="sr-only">회원가입</h1>
      <div className="w-full max-w-lg grid gap-6 sm:gap-8 bg-zinc-900 border-2 p-4 sm:p-8 rounded-xl">
        <Link className="w-fit mx-auto" href="/" prefetch={false}>
          <IconLogo className="w-9" priority />
        </Link>
        <SignupForm />
        <div className="grid gap-2 text-center text-xs leading-3.5 text-zinc-400 whitespace-nowrap">
          <p className="flex gap-1 justify-center flex-wrap">
            본 서비스에 가입하는 것으로
            <Link className="underline" href="/doc/terms" prefetch={false}>
              이용약관
            </Link>
            및
            <span>
              <Link className="underline" href="/doc/privacy" prefetch={false}>
                개인정보처리방침
              </Link>
              에
            </span>
            동의하는 것으로 간주합니다.
          </p>
          <p className="flex gap-1 justify-center flex-wrap">
            이미 계정이 있으신가요?
            <Link className="underline" href="/auth/login" prefetch={false}>
              로그인
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
