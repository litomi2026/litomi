'use client'

import { startRegistration } from '@simplewebauthn/browser'
import { useState } from 'react'
import { toast } from 'sonner'

import IconPlus from '@/components/icons/IconPlus'
import IconSpinner from '@/components/icons/IconSpinner'
import useMeQuery from '@/query/useMeQuery'

import { getRegistrationOptions, verifyRegistration } from './actions'

export default function PasskeyRegisterButton() {
  const [loading, setLoading] = useState(false)
  const { data: me } = useMeQuery()
  const myName = me?.name

  async function handleRegisterPasskey() {
    if (!myName) {
      toast.warning('로그인 후 이용해주세요')
      return
    }

    setLoading(true)

    try {
      const optionsResult = await getRegistrationOptions()

      if (!optionsResult.ok) {
        toast.error(optionsResult.error)
        return
      }

      const registrationResponse = await startRegistration({ optionsJSON: optionsResult.data })
      const verifyResult = await verifyRegistration(registrationResponse)

      if (!verifyResult.ok) {
        toast.error(verifyResult.error)
        return
      }

      toast.success('패스키를 등록했어요')
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('패스키 등록이 취소됐어요')
        } else if (error.name === 'InvalidStateError') {
          toast.error('이미 등록된 패스키가 있어요')
        } else if (error.name === 'NotSupportedError') {
          toast.error('이 브라우저는 패스키를 지원하지 않아요')
        }
      } else {
        toast.error('패스키 등록 중 오류가 발생했어요')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="flex items-center gap-2 group rounded-full border-brand-end/70 bg-brand-end/5 border-2 px-5 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={loading}
      onClick={handleRegisterPasskey}
    >
      {loading ? <IconSpinner className="size-4" /> : <IconPlus className="size-4" />}
      패스키 추가
    </button>
  )
}
