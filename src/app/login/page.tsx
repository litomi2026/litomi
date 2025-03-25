import Link from 'next/link'

export default async function Page() {
  return (
    <main className="flex h-dvh items-center justify-center p-4">
      <div className="flex w-full max-w-lg flex-col items-center justify-center rounded-lg px-6 py-12 bg-zinc-900">
        <h1 className="mb-8 text-2xl font-semibold text-zinc-700 dark:text-zinc-200">로그인</h1>
        <div className="grid w-full gap-4 text-center sm:text-lg">
          <form className="grid gap-4">
            <label className="flex flex-col gap-1">
              <span>아이디</span>
              <input
                className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-blue-500"
                name="id"
                type="text"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>비밀번호</span>
              <input
                className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-blue-500"
                type="password"
              />
            </label>
            <button className="border-2 border-brand-gradient text-sm font-semibold rounded-xl" type="submit">
              <div className="p-2 bg-zinc-900 rounded-xl">로그인</div>
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          본 서비스에 로그인하는 것으로{' '}
          <Link className="underline" href="/doc/terms">
            이용약관
          </Link>{' '}
          및{' '}
          <Link className="underline" href="/doc/privacy">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주합니다
        </p>
      </div>
    </main>
  )
}
