'use client'

import type { DELETEV1MeBody, DELETEV1MeResponse } from '@litomi/contracts'

import { PASSWORD_PATTERN } from '@litomi/domain/auth/policy'
import { getInvalidParams, type ProblemDetails } from '@litomi/http/problem-details'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { useRouter } from '@/i18n/navigation'
import { handleUnauthorizedError } from '@/lib/react-query/auth-state'
import { ProblemDetailsError } from '@/utils/fetch-response'

import OneTimeCodeInput from '../two-factor/components/OneTimeCodeInput'
import { deleteMyAccount } from './api'

const CONSEQUENCES = [
  '북마크, 열람 기록, 평점이 삭제돼요',
  '게시글, 좋아요, 채팅 데이터가 삭제돼요',
  '세션, 패스키, 검열/알림 설정이 삭제돼요',
  '포인트와 알림 내역이 삭제돼요',
  '프로필 정보가 영구 삭제돼요',
]

const deletionFieldLabelClassName = 'block mb-1.5 text-sm font-medium text-zinc-200'

const deletionFieldClassName = `w-full rounded-2xl bg-white/[0.035] border border-white/10 px-4 py-3 leading-6 text-zinc-50 placeholder:text-zinc-500 transition
  focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-transparent
  disabled:opacity-60 disabled:cursor-not-allowed
  user-invalid:border-red-600/50 user-invalid:focus:ring-red-600/25`

const deletionFieldActionClassName = `absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 bg-white/[0.04] border border-white/8 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition
  opacity-0 pointer-events-none
  group-has-[input:focus:not(:placeholder-shown)]:opacity-100 group-has-[input:focus:not(:placeholder-shown)]:pointer-events-auto
  aria-pressed:[&_.eye-icon]:hidden aria-pressed:[&_.eye-off-icon]:block
  disabled:opacity-50`

enum DeletionStep {
  INITIAL,
  CONFIRM,
  FINAL,
}

type Props = {
  isTwoFactorEnabled: boolean
  loginId: string
}

export default function AccountDeletionForm({ loginId, isTwoFactorEnabled }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<DeletionStep>(DeletionStep.INITIAL)
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [token, setToken] = useState('')
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement | null>(null)

  const expectedConfirmText = `${loginId} 계정을 삭제해요`
  const isConfirmTextValid = confirmText === expectedConfirmText
  const normalizedToken = token.replace(/[^0-9]/g, '')
  const canSubmit = password.length > 0 && (!isTwoFactorEnabled || normalizedToken.length === 6)

  const deleteMutation = useMutation<DELETEV1MeResponse, ProblemDetailsError, DELETEV1MeBody>({
    mutationFn: deleteMyAccount,

    onSuccess: (data) => {
      handleUnauthorizedError(queryClient)
      toast.success(data.message)
      router.replace('/')
    },

    onError: (error) => {
      if (error.status === 401) {
        handleUnauthorizedError(queryClient)
        setPassword('')
        setIsPasswordVisible(false)
        setToken('')
        router.refresh()
        return
      }

      const applied = applyAccountDeletionProblem(formRef.current, error.problem)

      if (applied) {
        return
      }

      if (error.status === 400) {
        setPassword('')
        setIsPasswordVisible(false)
        setToken('')
        toast.warning(error.message)
        return
      }
    },

    meta: {
      suppressGlobalErrorToastForStatuses: [400],
    },
  })

  const isPending = deleteMutation.isPending

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    clearDeletionValidity(e.currentTarget)

    if (!e.currentTarget.reportValidity()) {
      return
    }

    deleteMutation.mutate({
      password,
      ...(isTwoFactorEnabled && { token: normalizedToken }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Initial Warning */}
      {step === DeletionStep.INITIAL && (
        <div className="space-y-6">
          <div className="bg-red-950/20 border-2 border-red-900/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="size-5 shrink-0 text-red-500" />
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
              className={twMerge(
                'w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-600 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
                'placeholder-zinc-500',
              )}
              disabled={isPending}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="위 문구를 입력해 주세요"
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
              className={twMerge(
                'flex-1 px-4 py-3 bg-red-900 hover:bg-red-800 disabled:bg-zinc-700',
                'text-foreground rounded-lg font-medium transition',
                'flex items-center justify-center gap-2',
              )}
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
        <form
          className="space-y-6"
          onInput={(e) => clearDeletionInputValidity(e.target)}
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <div className="bg-red-950/30 border-2 border-red-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-red-400">마지막 확인</h2>
            <p className="text-zinc-300 mb-6">계정 보안을 위해 비밀번호를 입력해주세요. 이 작업은 되돌릴 수 없어요.</p>
            <div>
              <label className={deletionFieldLabelClassName} htmlFor="account-deletion-password">
                현재 비밀번호
              </label>
              <div className="relative group">
                <input
                  aria-describedby="account-deletion-password-help"
                  autoCapitalize="off"
                  autoComplete="current-password"
                  autoCorrect="off"
                  className={`${deletionFieldClassName} pr-10`}
                  disabled={isPending}
                  enterKeyHint="done"
                  id="account-deletion-password"
                  maxLength={64}
                  minLength={8}
                  name="password"
                  onChange={(e) => setPassword(e.target.value)}
                  pattern={PASSWORD_PATTERN}
                  placeholder="현재 비밀번호"
                  required
                  spellCheck={false}
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label="비밀번호 표시"
                  aria-pressed={isPasswordVisible}
                  className={deletionFieldActionClassName}
                  disabled={isPending}
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  onMouseDown={(e) => e.preventDefault()}
                  tabIndex={-1}
                  type="button"
                >
                  <Eye className="eye-icon size-3.5" />
                  <EyeOff className="eye-off-icon size-3.5 hidden" />
                </button>
              </div>
            </div>

            {isTwoFactorEnabled && (
              <div className="mt-4">
                <label className={deletionFieldLabelClassName} htmlFor="account-deletion-token">
                  2단계 인증 코드
                </label>
                <OneTimeCodeInput
                  aria-describedby="account-deletion-token-help"
                  className={`${deletionFieldClassName} text-center text-base font-medium font-mono tabular-nums tracking-widest`}
                  disabled={isPending}
                  id="account-deletion-token"
                  onChange={(e) => setToken(e.target.value)}
                  value={token}
                />
              </div>
            )}
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
                setIsPasswordVisible(false)
                setToken('')
              }}
              type="button"
            >
              이전 단계
            </button>
            <button
              className={twMerge(
                'flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700',
                'text-foreground rounded-lg font-medium transition',
                'flex items-center justify-center gap-2',
              )}
              disabled={!canSubmit || isPending}
              type="submit"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 shrink-0" />}
              계정 영구 삭제
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function applyAccountDeletionProblem(form: HTMLFormElement | null, problem: ProblemDetails) {
  let firstInvalidInput: HTMLInputElement | null = null

  for (const param of getInvalidParams(problem)) {
    if (param.name !== 'password' && param.name !== 'token') {
      continue
    }

    const input = form?.elements.namedItem(param.name)

    if (!(input instanceof HTMLInputElement)) {
      continue
    }

    input.setCustomValidity(param.reason)

    if (!firstInvalidInput) {
      firstInvalidInput = input
    }
  }

  if (!firstInvalidInput) {
    return false
  }

  firstInvalidInput.focus()
  firstInvalidInput.reportValidity()
  return true
}

function clearDeletionInputValidity(target: EventTarget | null) {
  if (target instanceof HTMLInputElement) {
    target.setCustomValidity('')
  }
}

function clearDeletionValidity(form: HTMLFormElement | null) {
  const passwordInput = form?.elements.namedItem('password')
  const tokenInput = form?.elements.namedItem('token')

  if (passwordInput instanceof HTMLInputElement) {
    passwordInput.setCustomValidity('')
  }

  if (tokenInput instanceof HTMLInputElement) {
    tokenInput.setCustomValidity('')
  }
}
