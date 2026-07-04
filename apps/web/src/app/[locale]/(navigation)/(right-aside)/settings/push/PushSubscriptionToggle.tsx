'use client'

import { env } from '@litomi/env/client'
import { Toggle } from '@litomi/ui'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import { checkIOSDevice, checkIOSSafari, urlBase64ToUint8Array } from '@/utils/browser'

import { createPushSubscription, deletePushSubscriptionByEndpoint } from './api'
import { getCurrentBrowserEndpoint } from './common'

const { NEXT_PUBLIC_VAPID_PUBLIC_KEY } = env

type Props = {
  endpoints: string[]
}

export default function PushSubscriptionToggle({ endpoints }: Props) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const router = useRouter()

  const pushSubscriptionMutation = useMutation({
    mutationFn: (enabled: boolean) => {
      if (enabled) {
        return subscribeNotification()
      } else {
        return unsubscribeNotification()
      }
    },
  })

  async function subscribeNotification() {
    let subscription: PushSubscription | null = null

    if (!('Notification' in window)) {
      if (checkIOSSafari()) {
        toast.warning('iOS에서는 "홈 화면에 추가"한 뒤에 알림을 받을 수 있어요')
      } else if (checkIOSDevice()) {
        toast.warning('iOS에서는 Safari로 열고 "홈 화면에 추가"해 주세요')
      } else {
        toast.warning('이 브라우저는 알림을 지원하지 않아요')
      }
      return
    }

    if (!('serviceWorker' in navigator)) {
      toast.warning('Service Worker를 사용할 수 없어요')
      return
    }

    try {
      const permission = await Notification.requestPermission()

      if (permission === 'denied') {
        toast.error('알림 권한이 거부됐어요')
        return
      }

      if (permission !== 'granted') {
        toast.warning('알림 권한을 허용해야 푸시 알림을 받을 수 있어요')
        return
      }

      const registration = await navigator.serviceWorker.ready

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      const { keys } = subscription.toJSON()

      if (!keys?.p256dh || !keys.auth) {
        toast.warning('푸시 구독 정보를 읽지 못했어요')
        return
      }

      await createPushSubscription({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: keys.p256dh,
            auth: keys.auth,
          },
        },
        userAgent: navigator.userAgent,
      })

      setIsSubscribed(true)
      toast.success('이 브라우저의 푸시 알림을 활성화했어요')
      router.refresh()
    } catch (error) {
      if (subscription) {
        await subscription.unsubscribe().catch(() => undefined)
      }

      throw error
    }
  }

  async function unsubscribeNotification() {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      setIsSubscribed(false)
      toast.success('알림이 비활성화됐어요')
      return
    }

    await deletePushSubscriptionByEndpoint({ endpoint: subscription.endpoint })
    await subscription.unsubscribe().catch(() => undefined)

    setIsSubscribed(false)
    toast.success('이 브라우저의 푸시 알림을 비활성화했어요')
    router.refresh()
  }

  useEffect(() => {
    let canceled = false

    async function syncSubscriptionStatus() {
      const currentEndpoint = await getCurrentBrowserEndpoint()

      if (!canceled) {
        setIsSubscribed(Boolean(currentEndpoint && endpoints.includes(currentEndpoint)))
      }
    }

    syncSubscriptionStatus()

    return () => {
      canceled = true
    }
  }, [endpoints])

  return (
    <Toggle
      checked={isSubscribed}
      className="w-12 sm:w-14 peer-checked:bg-brand/80 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
      disabled={pushSubscriptionMutation.isPending}
      onToggle={pushSubscriptionMutation.mutate}
    />
  )
}
