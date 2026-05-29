import LoginButton from '@/components/LoginButton'

export default function Unauthorized() {
  return (
    <div className="grid gap-6 p-8">
      <div className="max-w-2xl mx-auto w-full text-center">
        <h1 className="text-2xl font-semibold mb-4">로그인이 필요해요</h1>
        <p className="text-zinc-400 mb-6">내 후원 목록은 로그인한 사용자만 볼 수 있어요</p>
        <LoginButton>로그인하기</LoginButton>
      </div>
    </div>
  )
}
