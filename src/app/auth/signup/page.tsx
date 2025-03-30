import GuestOnly from '@/components/GuestOnly'
import IconLogo from '@/components/icons/IconLogo'
import { ErrorBoundary, Suspense } from '@suspensive/react'
import Link from 'next/link'

import SignupForm from './SignupForm'

export default function Page() {
  return (
    <main className="flex h-dvh items-center justify-center p-4">
      <h1 className="sr-only">회원가입</h1>
      <div className="w-full max-w-lg grid gap-6 sm:gap-8 bg-zinc-900 border-2 border-zinc-800 p-4 sm:p-8 rounded-xl">
        <Link className="w-fit mx-auto" href="/">
          <IconLogo className="w-9" priority />
        </Link>
        <SignupForm />
        <div className="grid gap-2 text-center text-xs text-zinc-400">
          <p>
            본 서비스에 가입하는 것으로{' '}
            <Link className="underline" href="/doc/terms">
              이용약관
            </Link>{' '}
            및{' '}
            <Link className="underline" href="/doc/privacy">
              개인정보처리방침
            </Link>
            에 <br />
            동의하는 것으로 간주합니다.
          </p>
          <p>
            이미 계정이 있으신가요?{' '}
            <Link className="underline" href="/auth/login">
              로그인
            </Link>
          </p>
        </div>
      </div>
      <ErrorBoundary fallback={null}>
        <Suspense clientOnly>
          <GuestOnly />
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
