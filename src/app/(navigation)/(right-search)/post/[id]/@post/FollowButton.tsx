'use client'

import { useState } from 'react'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'
import { showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'

type Props = {
  leader: {
    id: number
    name: string
  }
}

export default function FollowButton({ leader }: Readonly<Props>) {
  const isFollowing = false // Replace with actual logic to check if the user is following the leader
  const { data: me } = useMeQuery()

  function handleButtonClick() {
    if (!me) {
      showLoginRequiredToast()
      return
    }

    if (isFollowing) {
      setIsOpened(true)
      return
    }

    // followMutation({ type: 'follow' })
  }

  const [isOpened, setIsOpened] = useState(false)

  return (
    <>
      <button
        aria-disabled={!me}
        aria-pressed={isFollowing}
        className="bg-zinc-700 whitespace-nowrap rounded-full px-4 py-2 text-sm border-2 
        aria-disabled:bg-zinc-600 aria-disabled:text-zinc-400 aria-disabled:border-transparent  
        aria-pressed:border-zinc-300 aria-pressed:bg-transparent aria-pressed:hover:border-red-500 aria-pressed:hover:text-red-500"
        onClick={handleButtonClick}
      >
        {isFollowing ? '팔로잉' : '팔로우'}
      </button>
      <Dialog ariaLabel="언팔로우" className="sm:max-w-lg" onClose={() => setIsOpened(false)} open={isOpened}>
        <form className="flex flex-1 flex-col min-h-0">
          <DialogHeader onClose={() => setIsOpened(false)} title="언팔로우" />

          <DialogBody className="p-6">
            <h4 className="pb-2 text-xl font-bold">
              @<span>{leader.name}</span> 님을 언팔로우할까요?
            </h4>
            <p className="text-zinc-400">
              이 사용자들의 게시물은 더 이상 추천 타임라인에 표시되지 않습니다. 이러한 사용자의 프로필은 게시물이 비공개로
              설정되지 않는 한 계속 볼 수 있습니다.
            </p>
          </DialogBody>

          <DialogFooter className="grid gap-3">
            <button
              className="bg-zinc-500 rounded-full p-3 font-bold text-foreground transition hover:brightness-110 disabled:opacity-50"
              disabled={!me}
              type="submit"
            >
              언팔로우
            </button>
            <button
              className="rounded-full border p-3 transition hover:bg-zinc-800 disabled:opacity-50"
              disabled={!me}
              onClick={() => setIsOpened(false)}
              type="button"
            >
              취소
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
