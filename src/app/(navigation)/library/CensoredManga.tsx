import { OctagonMinus } from 'lucide-react'
import Link from 'next/link'

type Props = {
  mangaId: number
  className?: string
}

export default function CensoredManga({ mangaId, className = '' }: Readonly<Props>) {
  return (
    <Link
      className={`absolute inset-0 flex flex-col items-center justify-center p-4 rounded-t-xl animate-fade-in-fast bg-zinc-900 text-zinc-400 hover:underline ${className}`}
      href={`/manga/${mangaId}`}
      prefetch={false}
    >
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
        <OctagonMinus className="size-6 text-red-500" />
      </div>
      <div>{mangaId}</div>
      <div className="font-semibold mb-1">검열된 작품</div>
    </Link>
  )
}
