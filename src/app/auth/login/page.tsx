import { Metadata } from 'next'
import Link from 'next/link'

import IconLogo from '@/components/icons/IconLogo'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'

import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: '로그인',
  openGraph: {
    ...defaultOpenGraph,
    title: `로그인 - ${SHORT_NAME}`,
    url: '/auth/login',
  },
  alternates: {
    canonical: '/auth/login',
    languages: { ko: '/auth/login' },
  },
}

export default function Page() {
  return (
    <main className="flex justify-center items-center min-h-full p-4">
      <h1 className="sr-only">로그인</h1>
      <div className="w-full max-w-lg grid gap-6 sm:gap-8 bg-zinc-900 border-2 p-4 py-8 sm:p-6 sm:py-10 rounded-xl">
        <Link className="w-fit mx-auto" href="/" prefetch={false}>
          <IconLogo className="w-9" priority />
        </Link>
        <LoginForm />
        <p className="text-center flex flex-wrap gap-1 justify-center text-xs text-zinc-400">
          계정이 없으신가요?
          <Link className="underline" href="/auth/signup" prefetch={false}>
            회원가입
          </Link>
        </p>
      </div>
    </main>
  )
}
