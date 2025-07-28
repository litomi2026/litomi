import IconKey from '@/components/icons/IconKey'
import IconShield from '@/components/icons/IconShield'

export default function PasskeyEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="mb-6 relative">
        <IconKey className="h-20 w-20 text-zinc-600" />
        <IconShield className="h-10 w-10 text-blue-500 absolute -bottom-1 -right-1" />
      </div>
      <h2 className="text-2xl font-semibold mb-3">패스키로 더 안전하게</h2>
      <p className="text-zinc-400 max-w-md mb-6">
        패스키는 비밀번호보다 안전하고 빠른 로그인 방법이에요. 생체 인증이나 보안 키로 간편하게 로그인할 수 있어요.
      </p>
      <details className="max-w-md group/details">
        <summary className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer list-none">
          패스키가 뭔가요?
        </summary>
        <div className="mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-left overflow-hidden group-open/details:animate-fade-in-fast">
          <h3 className="font-medium mb-3">패스키의 장점</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>피싱 공격에 안전해요 - 가짜 사이트에서는 작동하지 않아요</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>비밀번호를 기억할 필요가 없어요</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Touch ID, Face ID, Windows Hello 등으로 빠르게 로그인</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>각 기기에 안전하게 저장되어 유출 위험이 없어요</span>
            </li>
          </ul>
        </div>
      </details>
    </div>
  )
}
