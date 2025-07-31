import Link from 'next/link'

import IconBookmark from '@/components/icons/IconBookmark'
import IconLogo from '@/components/icons/IconLogo'

type Props = {
  usernameFromLoginUser: string
  usernameFromParam: string
}

export function PrivateBookmarksView({ usernameFromLoginUser, usernameFromParam }: Readonly<Props>) {
  return (
    <div className="flex flex-col items-center justify-center grow px-4 py-16 text-center">
      <div className="mb-8 relative">
        <IconLogo className="w-24 h-24 text-zinc-600" />
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-700">
          <IconBookmark className="w-6 h-6 text-zinc-400" />
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-4">비공개 북마크</h1>
      <div className="max-w-md space-y-3 text-zinc-400 mb-8">
        <p>
          현재 <span className="font-mono text-zinc-300">@{usernameFromParam}</span>님의 북마크는 본인만 볼 수 있어요
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-xl 
          hover:bg-zinc-700 active:bg-zinc-800 transition font-medium"
          href={`/@${usernameFromLoginUser}/bookmark`}
        >
          <IconBookmark className="w-5 h-5" />내 북마크 보기
        </Link>

        <Link
          className="inline-flex items-center gap-2 px-6 py-3 border-2 border-zinc-700 rounded-xl 
          hover:bg-zinc-800 active:bg-zinc-900 transition font-medium"
          href={`/@${usernameFromParam}`}
        >
          @{usernameFromParam}님의 프로필 보기
        </Link>
      </div>
    </div>
  )
}
