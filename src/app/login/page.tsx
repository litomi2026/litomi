import Link from 'next/link'

export default function Page() {
  return (
    <main className="flex h-dvh items-center justify-center p-4">
      <div className="w-full max-w-lg grid gap-6 sm:gap-8 bg-zinc-900 border-2 border-zinc-800 p-4 sm:p-8 rounded-xl">
        <h1 className="text-center text-xl sm:text-2xl font-bold">로그인</h1>
        <form
          action="/api/auth/login"
          className="grid gap-6 
            [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300
            [&_input]:mt-1.5 [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
            [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-500 
            [&_input]:focus:border-transparent"
          method="post"
        >
          <div className="grid gap-4">
            <div>
              <label htmlFor="id">아이디</label>
              <input id="id" name="id" placeholder="아이디를 입력하세요" />
            </div>
            <div>
              <label htmlFor="password">비밀번호</label>
              <input id="password" name="password" placeholder="비밀번호를 입력하세요" type="password" />
            </div>
          </div>
          <button className="border-2 border-brand-gradient font-medium rounded-xl" type="submit">
            <div className="p-2 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900">로그인</div>
          </button>
        </form>
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
