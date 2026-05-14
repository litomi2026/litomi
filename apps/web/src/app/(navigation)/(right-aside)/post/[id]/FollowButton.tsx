'use client'

import Dialog from '@litomi/ui/dialog'
import DialogBody from '@litomi/ui/dialog-body'
import DialogFooter from '@litomi/ui/dialog-footer'
import DialogHeader from '@litomi/ui/dialog-header'
import { Check, Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'

import { showLoginRequiredToast } from '@/lib/toast'
import useFollowingUserSetQuery from '@/query/useFollowingUserSetQuery'
import useMeQuery from '@/query/useMeQuery'
import useUserFollowMutation from '@/query/useUserFollowMutation'

type Props = {
  initialFollowing?: boolean
  leader: {
    id: number
    name: string
  }
  onError?: (following: boolean) => void
  onOptimisticUpdate?: (following: boolean) => void
}

export default function FollowButton({ initialFollowing, leader, onError, onOptimisticUpdate }: Props) {
  const [isOpened, setIsOpened] = useState(false)
  const { data: me } = useMeQuery()
  const { data: followingUserIds } = useFollowingUserSetQuery()

  const isFollowing = followingUserIds?.has(leader.id) ?? initialFollowing

  const followMutation = useUserFollowMutation(leader.id, {
    initialFollowing: isFollowing,
    onError,
    onOptimisticUpdate,
  })

  const isMyPost = me?.id === leader.id
  const isPending = followMutation.isPending

  function handleButtonClick() {
    if (!me) {
      showLoginRequiredToast()
      return
    }

    if (isFollowing) {
      setIsOpened(true)
      return
    }

    void followMutation.setFollowing(true)
  }

  async function handleUnfollowSubmit(event: React.SubmitEvent) {
    event.preventDefault()

    const didSucceed = await followMutation.setFollowing(false)

    if (didSucceed) {
      setIsOpened(false)
    }
  }

  if (isMyPost || followingUserIds === undefined) {
    return null
  }

  return (
    <>
      <button
        aria-busy={isPending}
        aria-disabled={isPending}
        aria-pressed={isFollowing}
        className="inline-flex min-w-24 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold tracking transition
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:cursor-progress disabled:opacity-80
        aria-pressed:bg-zinc-900 aria-pressed:text-zinc-100 aria-pressed:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
        aria-pressed:hover:border-red-400/60 aria-pressed:hover:bg-red-500/10 aria-pressed:hover:text-red-300
        border-transparent bg-foreground text-background shadow-[0_10px_28px_-22px_rgba(255,255,255,0.9)] hover:opacity-90 active:translate-y-px active:opacity-85"
        disabled={isPending}
        onClick={handleButtonClick}
        type="button"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : isFollowing ? (
          <Check aria-hidden="true" className="size-4" />
        ) : (
          <UserPlus aria-hidden="true" className="size-4" />
        )}
        <span>{isFollowing ? '팔로잉' : '팔로우'}</span>
      </button>
      <Dialog ariaLabel="언팔로우" className="sm:max-w-lg" onClose={() => setIsOpened(false)} open={isOpened}>
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleUnfollowSubmit}>
          <DialogHeader onClose={() => setIsOpened(false)} title="언팔로우" />

          <DialogBody className="p-6">
            <h4 className="pb-2 text-lg font-bold">
              @<span>{leader.name}</span> 님을 언팔로우할까요?
            </h4>
            <p className="text-zinc-400 text-sm">
              이 사용자들의 게시물은 더 이상 추천 타임라인에 표시되지 않습니다. 이러한 사용자의 프로필은 게시물이
              비공개로 설정되지 않는 한 계속 볼 수 있습니다.
            </p>
          </DialogBody>

          <DialogFooter className="grid gap-3">
            <button
              className="rounded-2xl bg-red-500 px-4 py-3 font-bold text-white transition hover:bg-red-400 active:bg-red-600 disabled:opacity-50"
              disabled={!me || isPending}
              type="submit"
            >
              언팔로우
            </button>
            <button
              className="rounded-2xl border border-zinc-700 bg-zinc-900/80 p-3 font-semibold text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-50"
              disabled={!me || isPending}
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
