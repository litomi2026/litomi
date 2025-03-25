import Link from 'next/link'

export default function Page() {
  return (
    <main className="flex h-dvh items-center justify-center p-4">
      <div className="w-full max-w-lg grid gap-6 sm:gap-8 bg-zinc-900 border-2 border-zinc-800 p-4 sm:p-8 rounded-xl">
        <h1 className="text-center text-xl sm:text-2xl font-bold">회원가입</h1>
        <form
          action="/api/auth/signup"
          className="grid gap-6 
            [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300
            [&_input]:mt-1.5 [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
            [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-500 
            [&_input]:focus:border-transparent"
          method="post"
        >
          <div className="grid gap-4">
            <div>
              <label htmlFor="id">
                아이디 <span className="text-red-500">*</span>
              </label>
              <input id="id" maxLength={255} minLength={4} name="id" placeholder="아이디를 입력하세요" required />
            </div>
            <div>
              <label htmlFor="password">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                maxLength={255}
                minLength={8}
                name="password"
                placeholder="비밀번호를 입력하세요"
                required
                type="password"
              />
            </div>
            <div>
              <label htmlFor="password-confirm">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                id="password-confirm"
                maxLength={255}
                minLength={8}
                name="password-confirm"
                placeholder="비밀번호를 다시 입력하세요"
                required
                type="password"
              />
            </div>
            <div>
              <label htmlFor="nickname">닉네임</label>
              <input id="nickname" maxLength={255} minLength={2} name="nickname" placeholder="닉네임을 입력하세요" />
            </div>
          </div>
          <button className="border-2 border-brand-gradient font-medium rounded-xl" type="submit">
            <div className="p-2 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900">회원가입</div>
          </button>
        </form>
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
            에 동의하는 것으로 간주합니다.
            <br />
          </p>
          <p>
            이미 계정이 있으신가요?{' '}
            <Link className="underline" href="/login">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
