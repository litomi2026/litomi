import { BookmarkIcon } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center gap-4 p-8">
      <BookmarkIcon className="w-16 h-16 text-zinc-400" />
      <div className="text-center">
        <p className="text-zinc-500 text-lg">북마크가 비어 있어요</p>
        <p className="text-zinc-600 text-sm mt-2">마음에 드는 작품을 북마크해보세요</p>
      </div>
    </div>
  )
}
