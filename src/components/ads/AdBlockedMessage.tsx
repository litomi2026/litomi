import { ShieldOff } from 'lucide-react'

type Props = {
  width: number
  height: number
}

export default function AdBlockedMessage({ height, width }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border text-center bg-white/4 border-white/7"
      style={{ width: `min(${width}px, 100%)`, minHeight: height }}
    >
      <ShieldOff className="size-8 text-zinc-500" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-300">광고가 차단되고 있어요</p>
        <p className="text-xs text-zinc-500">
          광고 수익은 서버 운영과 작가 후원에 사용돼요.
          <br />이 사이트의 광고를 허용해 주시면 큰 도움이 돼요.
        </p>
      </div>
      <div className="text-xs text-zinc-600">광고가 보이면 클릭해서 리보를 적립할 수 있어요</div>
    </div>
  )
}
