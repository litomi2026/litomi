'use client'

import { startRegistration } from '@simplewebauthn/browser'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import useServerAction from '@/hook/useServerAction'

import { getRegistrationOptions, verifyRegistration } from './action-register'

export default function PasskeyRegisterButton() {
  const [, dispatchAction, isPending] = useServerAction({
    action: verifyRegistration,
    onSuccess: () => {
      toast.success('패스키를 등록했어요')
    },
    shouldSetResponse: false,
  })

  async function handleRegisterPasskey() {
    try {
      const optionsResult = await getRegistrationOptions()

      if (!optionsResult.ok) {
        if (optionsResult.status >= 500) {
          toast.error('패스키 등록 중 오류가 발생했어요')
        } else {
          toast.warning(optionsResult.error)
        }
        return
      }

      const registrationResponse = await startRegistration({ optionsJSON: optionsResult.data })
      dispatchAction(registrationResponse)
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.info('패스키 등록이 취소됐어요')
        } else if (error.name === 'InvalidStateError') {
          toast.info('이미 등록된 패스키가 있어요')
        } else if (error.name === 'NotSupportedError') {
          toast.warning('이 브라우저는 패스키를 지원하지 않아요')
        } else {
          toast.error('패스키 등록 중 오류가 발생했어요')
        }
      }
    }
  }

  return (
    <button
      className="flex items-center gap-2 group rounded-full border-brand/70 bg-brand/5 border-2 px-5 py-2.5 text-sm font-medium transition disabled:opacity-50"
      disabled={isPending}
      onClick={handleRegisterPasskey}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      패스키 추가
    </button>
  )
}
