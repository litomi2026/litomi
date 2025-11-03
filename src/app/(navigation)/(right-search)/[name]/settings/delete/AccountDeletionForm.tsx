'use client'

import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import IconSpinner from '@/components/icons/IconSpinner'
import IconTrash from '@/components/icons/IconTrash'
import { QueryKeys } from '@/constants/query'
import useActionResponse from '@/hook/useActionResponse'
import amplitude from '@/lib/amplitude/lazy'

import { deleteAccount } from './actions'
import ExportDataSection from './ExportDataSection'

const CONSEQUENCES = [
  '모든 북마크가 삭제돼요',
  '모든 검열 설정이 삭제돼요',
  '모든 패스키가 삭제돼요',
  '프로필 정보가 영구 삭제돼요',
]

enum DeletionStep {
  INITIAL,
  CONFIRM,
  FINAL,
}

type Props = {
  loginId: string
}

export default function AccountDeletionForm({ loginId }: Readonly<Props>) {
  const router = useRouter()
  const [step, setStep] = useState<DeletionStep>(DeletionStep.INITIAL)
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')
  const [hasExportedData, setHasExportedData] = useState(false)
  const queryClient = useQueryClient()

  const [_, dispatchAction, isPending] = useActionResponse({
    action: deleteAccount,
    onError: () => {
      setStep(DeletionStep.INITIAL)
      setConfirmText('')
      setPassword('')
    },
    onSuccess: () => {
      toast.success('계정이 삭제됐어요. 이용해 주셔서 감사합니다!')
      amplitude.reset()
      queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
      router.push('/')
    },
  })

  const expectedConfirmText = `${loginId} 계정을 삭제합니다`
  const isConfirmTextValid = confirmText === expectedConfirmText

  return (
    <div className="space-y-6">
      {/* Step 1: Initial Warning */}
      {step === DeletionStep.INITIAL && (
        <div className="space-y-6">
          <div className="bg-red-950/20 border-2 border-red-900/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 text-red-500" />
              계정 삭제 시 다음 내용이 영구 삭제돼요
            </h2>
            <ul className="space-y-3">
              {CONSEQUENCES.map((text, index) => (
                <li className="flex items-center gap-3 text-zinc-300" key={index}>
                  <Trash2 className="size-4 text-red-400" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <ExportDataSection hasExported={hasExportedData} onExportComplete={() => setHasExportedData(true)} />
          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition"
              onClick={() => setStep(DeletionStep.INITIAL)}
              type="button"
            >
              취소
            </button>
            <button
              className="flex-1 px-4 py-3 bg-red-900 hover:bg-red-800 text-foreground rounded-lg font-medium transition flex items-center justify-center gap-2"
              onClick={() => setStep(DeletionStep.CONFIRM)}
              type="button"
            >
              계속 진행
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirmation */}
      {step === DeletionStep.CONFIRM && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">정말로 삭제할까요?</h2>
            <p className="text-zinc-400 mb-6">계정 삭제를 확인하려면 아래 문구를 정확히 입력해주세요:</p>
            <div className="bg-zinc-800 p-3 rounded-lg mb-4 font-mono text-sm">{expectedConfirmText}</div>
            <input
              className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-600 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                  placeholder-zinc-500"
              disabled={isPending}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="위 문구를 입력해주세요"
              type="text"
              value={confirmText}
            />
            {confirmText && !isConfirmTextValid && (
              <p className="text-red-400 text-sm mt-2">문구가 일치하지 않습니다</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition"
              disabled={isPending}
              onClick={() => {
                setStep(DeletionStep.INITIAL)
                setConfirmText('')
              }}
              type="button"
            >
              이전 단계
            </button>
            <button
              className="flex-1 px-4 py-3 bg-red-900 hover:bg-red-800 disabled:bg-zinc-700 
                  text-foreground rounded-lg font-medium transition 
                  flex items-center justify-center gap-2"
              disabled={!isConfirmTextValid || isPending}
              onClick={() => setStep(DeletionStep.FINAL)}
              type="button"
            >
              {isConfirmTextValid && <Check className="size-4" />}
              최종 확인
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Final Confirmation with Password */}
      {step === DeletionStep.FINAL && (
        <form action={dispatchAction} className="space-y-6">
          <div className="bg-red-950/30 border-2 border-red-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-red-400">마지막 확인</h2>
            <p className="text-zinc-300 mb-6">계정 보안을 위해 비밀번호를 입력해주세요. 이 작업은 되돌릴 수 없어요.</p>
            <input
              className="w-full px-4 py-3 bg-zinc-800 border-2 border-red-900/50 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                  placeholder-zinc-500"
              disabled={isPending}
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="현재 비밀번호"
              required
              type="password"
              value={password}
            />
          </div>
          <div className="text-center space-y-2">
            <p className="text-red-400 font-semibold">이 작업은 즉시 실행되며 취소할 수 없어요</p>
            <p className="text-zinc-500 text-sm">삭제된 계정은 복구할 수 없어요</p>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition"
              disabled={isPending}
              onClick={() => {
                setStep(DeletionStep.CONFIRM)
                setPassword('')
              }}
              type="button"
            >
              이전 단계
            </button>
            <button
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 
                  text-foreground rounded-lg font-medium transition 
                  flex items-center justify-center gap-2"
              disabled={!password || isPending}
              type="submit"
            >
              {isPending ? (
                <>
                  <IconSpinner className="w-4" />
                  삭제 중...
                </>
              ) : (
                <>
                  <IconTrash className="w-4" />
                  계정 영구 삭제
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
