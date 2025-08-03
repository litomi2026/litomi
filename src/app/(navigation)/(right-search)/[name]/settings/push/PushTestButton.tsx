'use client'

import { toast } from 'sonner'

import useActionResponse from '@/hook/useActionResponse'

import { testNotification } from './action'

type Props = {
  isEnabled: boolean
}

export default function PushTestButton({ isEnabled }: Readonly<Props>) {
  const [_, dispatchTestNotification] = useActionResponse({
    action: testNotification,
    onError: (error) => {
      if (typeof error === 'string') {
        toast.error(error)
      }
    },
    onSuccess: (data) => {
      toast.success(data)
    },
    shouldSetResponse: false,
  })

  return (
    <button
      className="relative overflow-hidden px-6 py-2.5 rounded-lg text-sm font-medium group
      bg-gradient-to-r from-brand-start/10 to-brand-end/10
      border border-brand-end/20
      hover:border-brand-end/40
      transition-all duration-300
      hover:shadow-[0_0_20px_rgba(245,188,255,0.15)]
      active:scale-95
      "
      onClick={() => dispatchTestNotification({ message: '테스트 알림' })}
      type="button"
    >
      <span className="relative z-10">테스트 알림 보내기</span>
      <div
        aria-hidden={!isEnabled}
        className="absolute inset-0 bg-gradient-to-r from-brand-start/20 to-brand-end/20
        opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
    </button>
  )
}
