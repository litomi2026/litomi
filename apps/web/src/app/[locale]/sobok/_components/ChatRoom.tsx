'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useEffectEvent } from 'react'
import { consumeBillingKeyRedirect } from '../_lib/billing'
import useArtistQuery from '../_query/useArtistQuery'
import useSubscribeAction from '../_query/useSubscribeAction'
import ArtistSubscribe from './ArtistSubscribe'
import FanChatRoom from './FanChatRoom'

type Props = {
  handle: string
}

export default function ChatRoom({ handle }: Props) {
  const { data: artistData, isLoading: isArtistLoading } = useArtistQuery(handle)
  const router = useRouter()

  const artist = artistData?.artist
  const isOwner = artistData?.isOwner ?? false
  const entitled = artistData?.entitled ?? false
  const subscription = artistData?.subscription
  const showRoom = entitled || subscription !== undefined

  const {
    start: subscribe,
    finishWithBillingKey,
    reportError: reportSubscribeError,
    isPending: subscribing,
    error: subscribeError,
  } = useSubscribeAction(handle, artist?.displayName ?? '', !isOwner)

  // 모바일 빌링키 발급의 full-page redirect 복귀 — 등록을 마저 진행하고 구독까지 잇는다.
  const resumeBillingKeyFlow = useEffectEvent(() => {
    const result = consumeBillingKeyRedirect()

    if (!result) {
      return
    }

    if ('billingKey' in result) {
      finishWithBillingKey(result.billingKey)
    } else {
      reportSubscribeError(result.errorMessage)
    }
  })

  useEffect(() => {
    resumeBillingKeyFlow()
  }, [])

  // Owners belong in the studio, not the fan room.
  useEffect(() => {
    if (isOwner) {
      router.replace(`/sobok/studio/${handle}`)
    }
  }, [isOwner, handle, router])

  if (isArtistLoading || !artist || isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/30" />
      </div>
    )
  }

  if (!showRoom) {
    return (
      <ArtistSubscribe
        artist={artist}
        price={artistData?.price}
        onSubscribe={subscribe}
        isPending={subscribing}
        error={subscribeError}
      />
    )
  }

  return (
    <FanChatRoom
      artist={artist}
      entitled={entitled}
      handle={handle}
      onSubscribe={subscribe}
      replyTextLimit={artistData?.replyTextLimit}
      subscribeError={subscribeError}
      subscribing={subscribing}
      subscription={subscription}
    />
  )
}
