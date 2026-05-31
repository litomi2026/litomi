'use client'

import { Dialog, DialogBody, DialogHeader } from '@litomi/ui'
import { Fingerprint, Info } from 'lucide-react'
import { useState } from 'react'

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
      <Dialog
        ariaLabel="패스키란?"
        className="sm:max-w-sm"
        onClose={() => setShowInfoModal(false)}
        open={showInfoModal}
      >
        <DialogHeader onClose={() => setShowInfoModal(false)} title="패스키란?" />

        <DialogBody className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center">
              <Fingerprint className="h-8 w-8 text-brand" />
            </div>
            <p className="text-sm text-zinc-400">더 안전한 로그인 방법</p>
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-brand">1</span>
              </div>
              <div>
                <p className="font-medium mb-1">litomi에서만 작동해 피싱에 강해요</p>
                <p className="text-xs text-zinc-500">가짜 사이트에서는 같은 패스키를 사용할 수 없어요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-brand">2</span>
              </div>
              <div>
                <p className="font-medium mb-1">litomi에는 공개키만 저장돼요</p>
                <p className="text-xs text-zinc-500">로그인에 필요한 비밀키는 내 기기에 남아요</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-brand">3</span>
              </div>
              <div>
                <p className="font-medium mb-1">생체 인증 정보는 기기에 남아요</p>
                <p className="text-xs text-zinc-500">지문이나 얼굴 정보가 litomi로 전송되지 않아요</p>
              </div>
            </div>
          </div>
          <button
            className="w-full rounded-full bg-zinc-800 py-3 text-sm font-medium transition hover:bg-zinc-700 touch-manipulation"
            onClick={() => setShowInfoModal(false)}
            type="button"
          >
            알겠어요
          </button>
        </DialogBody>
      </Dialog>
    </>
  )
}
