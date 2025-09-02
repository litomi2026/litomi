import { Clock } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center gap-4 p-8">
      <Clock className="w-16 h-16 text-zinc-400" />
      <div className="text-center">
        <p className="text-zinc-500 text-lg">아직 읽은 작품이 없어요</p>
        <p className="text-zinc-600 text-sm mt-2">작품을 읽으면 여기에 기록이 남아요</p>
      </div>
    </div>
  )
}
