'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import useBillingKeyRedirect from '../_hooks/useBillingKeyRedirect'
import useArtistQuery from '../_query/useArtistQuery'
import useSubscribeAction from '../_query/useSubscribeAction'
import ArtistSubscribe from './ArtistSubscribe'
import FanChatRoom from './FanChatRoom'
import RoomSkeleton from './RoomSkeleton'
import PageHeader, { HeaderBackLink } from './ui/PageHeader'

type Props = {
  handle: string
}

export default function ChatRoom({ handle }: Props) {
  const { data: artistData, isLoading: isArtistLoading } = useArtistQuery(handle)
  const t = useTranslations('Sobok.billing')
  const tRoom = useTranslations('Sobok.fanRoom')
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
  useBillingKeyRedirect({
    failedMessage: t('registerFailed'),
    onBillingKey: finishWithBillingKey,
    onError: reportSubscribeError,
  })

  // Owners belong in the studio, not the fan room.
  useEffect(() => {
    if (isOwner) {
      router.replace(`/sobok/studio/${handle}`)
    }
  }, [isOwner, handle, router])

  if (isArtistLoading || isOwner) {
    return <RoomSkeleton />
  }

  if (!artist) {
    return (
      <div className="flex h-full flex-col bg-background">
        <PageHeader back={<HeaderBackLink className="lg:hidden" href="/sobok" />} title={null} />
        <div className="flex flex-1 items-center justify-center px-8">
          <p className="text-sm text-zinc-400">{tRoom('artistNotFound')}</p>
        </div>
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
      replyTextLimit={artistData?.replyTextLimit}
      subscribe={{ onSubscribe: subscribe, pending: subscribing, error: subscribeError }}
      subscription={subscription}
    />
  )
}
