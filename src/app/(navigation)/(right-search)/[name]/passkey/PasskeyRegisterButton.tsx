'use client'

import { startRegistration } from '@simplewebauthn/browser'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import IconFingerprint from '@/components/icons/IconFingerprint'
import IconKey from '@/components/icons/IconKey'
import Modal from '@/components/ui/Modal'
import useMeQuery from '@/query/useMeQuery'

import { getRegistrationOptions, verifyRegistration } from './actions'

export default function PasskeyRegisterButton() {
  const [loading, setLoading] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const router = useRouter()
  const { data: me } = useMeQuery()
  const myName = me?.name

  async function handleRegisterPasskey() {
    setLoading(true)

    try {
      // 1. Get registration options from server
      const optionsResult = await getRegistrationOptions()

      if (!optionsResult.success) {
        toast.error('패스키 등록을 시작할 수 없어요')
        return
      }

      // 2. Use browser WebAuthn API to create credential
      const registrationResponse = await startRegistration({
        optionsJSON: optionsResult.options!,
      })

      // 3. Verify registration with server
      const verifyResult = await verifyRegistration(registrationResponse, myName)

      if (!verifyResult.success) {
        toast.error('패스키 등록에 실패했어요')
        return
      }

      toast.success('패스키가 등록되었어요! 🎉')

      // Refresh the page to show the new passkey
      router.refresh()
    } catch (error) {
      console.error('Passkey registration error:', error)

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('패스키 등록이 취소되었어요')
        } else if (error.name === 'InvalidStateError') {
          toast.error('이미 등록된 패스키가 있어요')
        } else if (error.name === 'NotSupportedError') {
          toast.error('이 브라우저는 패스키를 지원하지 않아요')
        } else {
          toast.error('패스키 등록 중 오류가 발생했어요')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          className="group flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
          onClick={handleRegisterPasskey}
        >
          <IconKey className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span>{loading ? '등록 중...' : '새 패스키 등록'}</span>
        </button>

        <button
          aria-label="패스키 정보"
          className="rounded-lg p-2.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          onClick={() => setShowInfoModal(true)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>
      </div>

      <Modal onClose={() => setShowInfoModal(false)} open={showInfoModal} showCloseButton>
        <div className="w-full max-w-md rounded-lg bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-3">
            <IconFingerprint className="h-8 w-8 text-blue-500" />
            <h3 className="text-xl font-semibold">패스키 등록 안내</h3>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">등록 과정</h4>
              <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                <li>등록 버튼을 클릭하세요</li>
                <li>브라우저가 생체 인증을 요청합니다</li>
                <li>Touch ID, Face ID, 또는 PIN으로 인증하세요</li>
                <li>패스키가 안전하게 저장됩니다</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-1">지원 기기</h4>
              <ul className="space-y-1 text-zinc-400">
                <li>• macOS: Touch ID, Face ID</li>
                <li>• Windows: Windows Hello</li>
                <li>• Android/iOS: 지문, 얼굴, PIN</li>
              </ul>
            </div>

            <div className="rounded-lg bg-blue-900/20 border border-blue-800/50 p-3">
              <p className="text-blue-300">
                <span className="font-medium">보안 팁:</span> 패스키는 기기에만 저장되며 서버로 전송되지 않아 매우
                안전합니다.
              </p>
            </div>
          </div>

          <button
            className="mt-6 w-full rounded-lg bg-zinc-800 py-2 font-medium transition hover:bg-zinc-700"
            onClick={() => setShowInfoModal(false)}
          >
            확인
          </button>
        </div>
      </Modal>
    </>
  )
}
