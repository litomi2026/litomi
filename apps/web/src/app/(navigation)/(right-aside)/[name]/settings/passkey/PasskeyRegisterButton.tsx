'use client'

import type { POSTV1MePasskeyVerifyBody, POSTV1MePasskeyVerifyResponse } from '@litomi/contracts'

import { signalCurrentPasskeyUserDetails } from '@litomi/auth/passkey'
import { startRegistration } from '@simplewebauthn/browser'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { ProblemDetailsError } from '@/utils/react-query-error'

import { requestPasskeyRegistrationOptions, verifyPasskeyRegistration } from './api'
import { PasskeySignalData } from './common'

type Props = {
  passkeySignalData: PasskeySignalData
}

export default function PasskeyRegisterButton({ passkeySignalData }: Props) {
  const verifyMutation = useMutation<POSTV1MePasskeyVerifyResponse, ProblemDetailsError, POSTV1MePasskeyVerifyBody>({
    mutationFn: verifyPasskeyRegistration,
    onSuccess: async ({ credentialId, message }) => {
      await signalCurrentPasskeyUserDetails({
        ...passkeySignalData,
        credentialIds: [...passkeySignalData.credentialIds, credentialId].sort(),
      })

      toast.success(message)
    },
  })

  async function handleRegisterPasskey() {
    try {
      const { options } = await requestPasskeyRegistrationOptions()
      const registrationResponse = await startRegistration({ optionsJSON: options })

      verifyMutation.mutate({ registration: registrationResponse })
    } catch (error) {
      if (error instanceof ProblemDetailsError) {
        if (error.status >= 500) {
          toast.error('패스키 등록 중 오류가 발생했어요')
        } else {
          toast.warning(error.message)
        }
        return
      }

      if (error instanceof Error) {
        switch (error.name) {
          case 'InvalidStateError':
            toast.info('이미 등록된 패스키가 있어요')
            return
          case 'NotAllowedError':
            toast.info('패스키 등록이 취소됐어요')
            return
          case 'NotSupportedError':
            toast.warning('이 브라우저는 패스키를 지원하지 않아요')
            return
          default:
            toast.error('패스키 등록 중 오류가 발생했어요')
        }
      }
    }
  }

  return (
    <button
      className="flex items-center gap-2 group rounded-full border-brand/70 bg-brand/5 border-2 px-5 py-2.5 text-sm font-medium transition disabled:opacity-50"
      disabled={verifyMutation.isPending}
      onClick={handleRegisterPasskey}
    >
      {verifyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      패스키 추가
    </button>
  )
}
