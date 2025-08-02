import { useState } from 'react'
import { toast } from 'sonner'

import ToggleButton from '@/components/ui/ToggleButton'
import { NEXT_PUBLIC_VAPID_PUBLIC_KEY } from '@/constants/env'
import useActionResponse from '@/hook/useActionResponse'
import { urlBase64ToUint8Array } from '@/utils/browser'

import { subscribeToNotifications, unsubscribeFromNotifications } from './action'

type Props = {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

export default function PushSubscriptionToggle({ isEnabled, onToggle }: Readonly<Props>) {
  const [isPending, setIsPending] = useState(false)

  const [_, dispatchSubscriptionAction] = useActionResponse({
    action: subscribeToNotifications,
    onError: (error) => {
      if (typeof error === 'string') {
        toast.error(error)
      }
    },
    onSuccess: (data) => {
      onToggle(true)
      toast.success(data)
    },
    shouldSetResponse: false,
  })

  const [__, dispatchUnsubscriptionAction] = useActionResponse({
    action: unsubscribeFromNotifications,
    onError: (error) => {
      if (typeof error === 'string') {
        toast.error(error)
      }
    },
    onSuccess: (data) => {
      onToggle(false)
      toast.success(data)
    },
    shouldSetResponse: false,
  })

  async function subscribeNotification() {
    if (!('Notification' in window)) {
      toast.error('이 브라우저는 알림을 지원하지 않아요')
      return
    }

    if (!('serviceWorker' in navigator)) {
      toast.error('Service Worker를 사용할 수 없어요')
      return
    }

    try {
      setIsPending(true)

      const permission = await Notification.requestPermission()

      if (permission === 'denied') {
        toast.error('알림 권한이 거부됐어요')
        return
      }

      const registration = await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      dispatchSubscriptionAction({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      })
    } catch (error) {
      console.error('requestNotificationPermission:', error)
      toast.error('알림 활성화 중 오류가 발생했어요')
    } finally {
      setIsPending(false)
    }
  }

  async function unsubscribeNotification() {
    try {
      setIsPending(true)

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        onToggle(false)
        toast.success('알림이 비활성화되었습니다')
        return
      }

      await subscription.unsubscribe()
      dispatchUnsubscriptionAction({ endpoint: subscription.endpoint })
    } catch (error) {
      console.error('unsubscribeNotification:', error)
      toast.error('알림 비활성화 중 오류가 발생했습니다')
    } finally {
      setIsPending(false)
    }
  }

  function handleToggle(enabled: boolean) {
    if (enabled) {
      subscribeNotification()
    } else {
      unsubscribeNotification()
    }
  }

  return (
    <ToggleButton
      aria-label="푸시 알림 토글"
      className="w-12 aria-pressed:bg-brand-gradient disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isPending}
      enabled={isEnabled}
      onToggle={handleToggle}
    />
  )
}
