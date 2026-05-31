'use client'

import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { Check, Loader2, UserPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'

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
  const t = useTranslations('Community')

  const isFollowing = followingUserIds?.has(leader.id) ?? initialFollowing

  const followMutation = useUserFollowMutation(leader.id, {
    initialFollowing: isFollowing,
    onError,
    onOptimisticUpdate,
  })

  const isMyPost = me?.id === leader.id
  const isPending = followMutation.isPending

  function handleButtonClick() {
    if (me === null) {
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
        aria-pressed={isFollowing}
        className={twMerge(
          'inline-flex min-w-24 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold tracking transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-progress disabled:opacity-80',
          'aria-pressed:bg-zinc-900 aria-pressed:text-zinc-100 aria-pressed:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
          'aria-pressed:hover:border-red-400/60 aria-pressed:hover:bg-red-500/10 aria-pressed:hover:text-red-300',
          'border-transparent bg-foreground text-background shadow-[0_10px_28px_-22px_rgba(255,255,255,0.9)] hover:opacity-90 active:translate-y-px active:opacity-85',
        )}
        disabled={me === undefined || isPending}
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
        <span>{isFollowing ? t('follow.following') : t('follow.follow')}</span>
      </button>
      <Dialog
        ariaLabel={t('follow.unfollow')}
        className="sm:max-w-lg"
        onClose={() => setIsOpened(false)}
        open={isOpened}
      >
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleUnfollowSubmit}>
          <DialogHeader onClose={() => setIsOpened(false)} title={t('follow.unfollow')} />

          <DialogBody className="p-6">
            <h4 className="pb-2 text-lg font-bold">{t('follow.question', { name: leader.name })}</h4>
            <p className="text-zinc-400 text-sm">{t('follow.description')}</p>
          </DialogBody>

          <DialogFooter className="grid gap-3">
            <button
              className="rounded-2xl bg-red-500 px-4 py-3 font-bold text-white transition hover:bg-red-400 active:bg-red-600 disabled:opacity-50"
              disabled={!me || isPending}
              type="submit"
            >
              {t('follow.unfollow')}
            </button>
            <button
              className="rounded-2xl border border-zinc-700 bg-zinc-900/80 p-3 font-semibold text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-50"
              disabled={!me || isPending}
              onClick={() => setIsOpened(false)}
              type="button"
            >
              {t('common.cancel')}
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
