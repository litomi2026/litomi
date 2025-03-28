import logoImage from '@/images/logo.webp'
import Image from 'next/image'
import Link from 'next/link'

import LoginForm from './LoginForm'

export default function Page() {
  return (
    <main className="flex h-dvh items-center justify-center p-4">
      <h1 className="sr-only">로그인</h1>
      <div className="w-full max-w-lg grid gap-6 sm:gap-8 bg-zinc-900 border-2 border-zinc-800 p-4 sm:p-8 rounded-xl">
        <Link className="w-fit mx-auto" href="/">
          <Image alt="로고" src={logoImage} width={36} />
        </Link>
        <LoginForm />
        <p className="text-center text-xs text-zinc-400">
          계정이 없으신가요?{' '}
          <Link className="underline" href="/signup">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  )
}
