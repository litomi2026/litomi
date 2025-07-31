'use client'

import { startRegistration } from '@simplewebauthn/browser'
import { useState } from 'react'
import { toast } from 'sonner'

import IconFingerprint from '@/components/icons/IconFingerprint'
import IconInfo from '@/components/icons/IconInfo'
import IconPlus from '@/components/icons/IconPlus'
import Modal from '@/components/ui/Modal'
import useMeQuery from '@/query/useMeQuery'

import { getRegistrationOptions, verifyRegistration } from './actions'

export default function PasskeyRegisterButton() {
  const [loading, setLoading] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
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
      const verifyResult = await verifyRegistration(registrationResponse, myName)

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
    <>
      <div className="flex items-center gap-2">
        <button
          className="group relative overflow-hidden rounded-full border-brand-end/70 bg-brand-end/5 border-2 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          disabled={loading}
          onClick={handleRegisterPasskey}
        >
          <span className="relative flex justify-center items-center gap-2">
            <IconPlus className="h-4 w-4 sm:h-5 sm:w-5 transition" />
            {loading ? '등록하는 중' : '패스키 추가'}
          </span>
        </button>
        <button
          aria-label="패스키 정보"
          className="rounded-full p-2 sm:p-2.5 text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-300 touch-manipulation"
          onClick={() => setShowInfoModal(true)}
        >
          <IconInfo className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
      <Modal onClose={() => setShowInfoModal(false)} open={showInfoModal} showCloseButton>
        <div className="w-[90vw] max-w-xs sm:max-w-sm rounded-2xl bg-zinc-900 p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-brand-end/10 flex items-center justify-center">
              <IconFingerprint className="h-8 w-8 text-brand-end" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">패스키란?</h3>
            <p className="text-sm text-zinc-400">더 안전한 로그인 방법</p>
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-brand-end/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-brand-end">1</span>
              </div>
              <div>
                <p className="font-medium mb-1">피싱 공격 차단</p>
                <p className="text-xs text-zinc-500">가짜 사이트에서는 작동하지 않아요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-brand-end/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-brand-end">2</span>
              </div>
              <div>
                <p className="font-medium mb-1">간편한 생체 인증</p>
                <p className="text-xs text-zinc-500">지문이나 얼굴로 빠르게 로그인</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-brand-end/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-brand-end">3</span>
              </div>
              <div>
                <p className="font-medium mb-1">비밀번호 불필요</p>
                <p className="text-xs text-zinc-500">복잡한 비밀번호를 기억하지 않아도 돼요</p>
              </div>
            </div>
          </div>
          <button
            className="w-full rounded-full bg-zinc-800 py-3 text-sm font-medium transition hover:bg-zinc-700 touch-manipulation"
            onClick={() => setShowInfoModal(false)}
          >
            알겠어요
          </button>
        </div>
      </Modal>
    </>
  )
}
