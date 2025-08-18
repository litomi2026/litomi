import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import IconLogo from '@/components/icons/IconLogo'
import { CANONICAL_URL, defaultOpenGraph, SHORT_NAME } from '@/constants'

import LoginForm, { LoginFormSkeleton } from './LoginForm'

export const metadata: Metadata = {
  title: `로그인 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `로그인 - ${SHORT_NAME}`,
    url: `${CANONICAL_URL}/auth/login`,
  },
}

export default function Page() {
  return (
    <main className="flex justify-center items-center min-h-full p-4">
      <h1 className="sr-only">로그인</h1>
      <div className="w-full max-w-lg grid gap-6 sm:gap-8 bg-zinc-900 border-2 p-4 sm:p-8 rounded-xl">
        <Link className="w-fit mx-auto" href="/">
          <IconLogo className="w-9" priority />
        </Link>
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
        <p className="text-center flex flex-wrap gap-1 justify-center text-xs text-zinc-400">
          계정이 없으신가요?
          <Link className="underline" href="/auth/signup">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  )
}
