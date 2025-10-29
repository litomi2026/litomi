'use client'

import { Fingerprint, Info } from 'lucide-react'
import { useState } from 'react'

import Modal from '@/components/ui/Modal'

export default function PasskeyInfoButton() {
  const [showInfoModal, setShowInfoModal] = useState(false)

  return (
    <>
      <button
        aria-label="패스키 정보"
        className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
        onClick={() => setShowInfoModal(true)}
      >
        <Info className="size-5" />
      </button>
      <Modal onClose={() => setShowInfoModal(false)} open={showInfoModal} showCloseButton>
        <div className="w-[90vw] max-w-xs sm:max-w-sm rounded-2xl bg-zinc-900 p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-brand-end/10 flex items-center justify-center">
              <Fingerprint className="h-8 w-8 text-brand-end" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">패스키란?</h3>
            <p className="text-sm text-zinc-400">더 안전한 로그인 방법</p>
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-brand-end/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-brand-end">1</span>
              </div>
              <div>
                <p className="font-medium mb-1">피싱 공격 차단</p>
                <p className="text-xs text-zinc-500">가짜 사이트에서는 작동하지 않아요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-brand-end/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-brand-end">2</span>
              </div>
              <div>
                <p className="font-medium mb-1">간편한 생체 인증</p>
                <p className="text-xs text-zinc-500">지문이나 얼굴로 빠르게 로그인</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-brand-end/20 flex items-center justify-center shrink-0">
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
