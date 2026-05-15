import { Lock } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <Lock className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-foreground mb-2">로그인이 필요해요</h2>
        <p className="text-sm text-zinc-400">알림을 확인하려면 먼저 로그인해주세요</p>
      </div>
    </div>
  )
}
