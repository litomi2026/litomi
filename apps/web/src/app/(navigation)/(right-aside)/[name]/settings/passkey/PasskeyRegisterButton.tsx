'use client'

import { signalCurrentPasskeyUserDetails } from '@litomi/auth/passkey'
import { startRegistration } from '@simplewebauthn/browser'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import type { PasskeySignalData } from './common'

import { requestPasskeyRegistrationOptions, verifyPasskeyRegistration } from './api'

type Props = {
  passkeySignalData: PasskeySignalData
}

export default function PasskeyRegisterButton({ passkeySignalData }: Props) {
  const router = useRouter()

  const registerMutation = useMutation({
    mutationFn: registerPasskey,

    onSuccess: async (result) => {
      if (!result) {
        return
      }

      const { credentialId, message } = result

      await signalCurrentPasskeyUserDetails({
        ...passkeySignalData,
        credentialIds: [...passkeySignalData.credentialIds, credentialId].sort(),
      })

      toast.success(message)
      router.refresh()
    },
  })

  async function registerPasskey() {
    const { options } = await requestPasskeyRegistrationOptions()

    try {
      const registrationResponse = await startRegistration({ optionsJSON: options })
      return verifyPasskeyRegistration({ registration: registrationResponse })
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error
      }

      switch (error.name) {
        case 'InvalidStateError':
          toast.info('이미 등록된 패스키가 있어요')
          return null
        case 'NotAllowedError':
          toast.info('패스키 등록이 취소됐어요')
          return null
        case 'NotSupportedError':
          toast.warning('이 브라우저는 패스키를 지원하지 않아요')
          return null
        default:
          toast.error('패스키 등록 중 오류가 발생했어요')
          return null
      }
    }
  }

  return (
    <button
      className="flex items-center gap-2 group rounded-full border-brand/70 bg-brand/5 border-2 px-5 py-2.5 text-sm font-medium transition disabled:opacity-50"
      disabled={registerMutation.isPending}
      onClick={() => registerMutation.mutate()}
      type="button"
    >
      {registerMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      패스키 추가
    </button>
  )
}
