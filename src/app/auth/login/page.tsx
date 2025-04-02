import GuestOnly from '@/components/GuestOnly'
import IconLogo from '@/components/icons/IconLogo'
import { ErrorBoundary, Suspense } from '@suspensive/react'
import Link from 'next/link'

import LoginForm, { LoginFormSkeleton } from './LoginForm'

export default function Page() {
  return (
    <main className="flex h-dvh items-center justify-center p-4">
      <h1 className="sr-only">로그인</h1>
      <div className="w-full max-w-lg grid gap-6 sm:gap-8 bg-zinc-900 border-2 border-zinc-800 p-4 sm:p-8 rounded-xl">
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
      <ErrorBoundary fallback={null}>
        <Suspense clientOnly>
          <GuestOnly />
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
