'use client'

import type { PATCHV1MePasswordBody, PATCHV1MePasswordResponse } from '@litomi/contracts'

import { PASSWORD_PATTERN } from '@litomi/domain/auth/policy'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { useRouter } from '@/i18n/navigation'
import { handleUnauthorizedError } from '@/lib/react-query/auth-state'
import type { ProblemDetailsError } from '@/utils/fetch-response'

import OneTimeCodeInput from '../two-factor/components/OneTimeCodeInput'
import { changeMyPassword } from './api'
import {
  applyPasswordChangeProblem,
  clearPasswordChangeInputValidity,
  clearPasswordChangeValidity,
  getPasswordChangeInput,
} from './password-form'

type Props = {
  isTwoFactorEnabled: boolean
}

export default function PasswordChangeForm({ isTwoFactorEnabled }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState('')

  const normalizedToken = token.replace(/[^0-9]/g, '')
  const strengthInfo = getStrengthText(calculatePasswordStrength(newPassword))

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    (!isTwoFactorEnabled || normalizedToken.length === 6)

  const changePasswordMutation = useMutation<PATCHV1MePasswordResponse, ProblemDetailsError, PATCHV1MePasswordBody>({
    mutationFn: changeMyPassword,

    onSuccess: (data) => {
      clearSensitiveInputs()
      handleUnauthorizedError(queryClient)
      toast.success(data.message)
      router.replace('/auth/login')
    },

    onError: (error) => {
      if (error.status === 401) {
        clearSensitiveInputs()
        handleUnauthorizedError(queryClient)
        router.refresh()
        return
      }

      const applied = applyPasswordChangeProblem(formRef.current, error.problem)

      if (applied) {
        return
      }

      if (error.status === 400) {
        clearSensitiveInputs()
        toast.warning(error.message)
        return
      }
    },

    meta: {
      suppressGlobalErrorToastForStatuses: [400],
    },
  })

  const isPending = changePasswordMutation.isPending

  function clearSensitiveInputs() {
    clearPasswordChangeValidity(formRef.current)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setToken('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formElement = e.currentTarget
    clearPasswordChangeValidity(formElement)

    if (!formElement.reportValidity()) {
      return
    }

    if (newPassword !== confirmPassword) {
      const confirmPasswordInput = getPasswordChangeInput(formElement, 'confirmPassword')
      confirmPasswordInput?.setCustomValidity('새 비밀번호가 일치하지 않아요')
      confirmPasswordInput?.focus()
      confirmPasswordInput?.reportValidity()
      toast.warning('새 비밀번호가 일치하지 않아요')
      return
    }

    if (currentPassword === newPassword) {
      const newPasswordInput = getPasswordChangeInput(formElement, 'newPassword')
      newPasswordInput?.setCustomValidity('현재 비밀번호와 새 비밀번호가 같아요')
      newPasswordInput?.focus()
      newPasswordInput?.reportValidity()
      toast.warning('현재 비밀번호와 새 비밀번호가 같아요')
      return
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      ...(isTwoFactorEnabled && { token: normalizedToken }),
    })
  }

  return (
    <form
      className={twMerge(
        'grid gap-6',
        '[&_label]:block [&_label]:mb-1.5 [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300',
        '[&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600',
        '[&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2',
        '[&_input]:focus:ring-zinc-500 [&_input]:focus:border-transparent [&_input]:disabled:bg-zinc-700',
        '[&_input]:disabled:text-zinc-400 [&_input]:disabled:border-zinc-500 [&_input]:disabled:cursor-not-allowed',
        '[&_input]:aria-invalid:border-red-700 [&_input]:aria-invalid:focus:ring-red-700',
      )}
      name="password-change"
      onInput={(e) => clearPasswordChangeInputValidity(formRef.current, e.target)}
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <div>
        <label htmlFor="currentPassword">현재 비밀번호</label>
        <div className="relative">
          <input
            autoCapitalize="off"
            autoComplete="current-password"
            autoCorrect="off"
            disabled={isPending}
            enterKeyHint="next"
            id="currentPassword"
            name="currentPassword"
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호를 입력하세요"
            required
            spellCheck={false}
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-700"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            tabIndex={-1}
            type="button"
          >
            {showCurrentPassword ? (
              <EyeOff className="size-5 shrink-0 text-zinc-400" />
            ) : (
              <Eye className="size-5 shrink-0 text-zinc-400" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="newPassword">새 비밀번호</label>
        <div className="relative">
          <input
            autoCapitalize="off"
            autoComplete="new-password"
            autoCorrect="off"
            disabled={isPending}
            enterKeyHint="next"
            id="newPassword"
            maxLength={64}
            minLength={8}
            name="newPassword"
            onChange={(e) => setNewPassword(e.target.value)}
            pattern={PASSWORD_PATTERN}
            placeholder="새 비밀번호를 입력하세요"
            required
            spellCheck={false}
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-700"
            onClick={() => setShowNewPassword(!showNewPassword)}
            tabIndex={-1}
            type="button"
          >
            {showNewPassword ? (
              <EyeOff className="size-5 shrink-0 text-zinc-400" />
            ) : (
              <Eye className="size-5 shrink-0 text-zinc-400" />
            )}
          </button>
        </div>
        {strengthInfo.text ? (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1 h-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  className={twMerge(
                    'flex-1 rounded-full transition-all',
                    level <= calculatePasswordStrength(newPassword) ? strengthInfo.barColor : 'bg-zinc-700',
                  )}
                  key={level}
                />
              ))}
            </div>
            <p className={`text-xs ${strengthInfo.color}`}>비밀번호 강도: {strengthInfo.text}</p>
          </div>
        ) : (
          <p className="mt-1.5 text-xs text-zinc-400">
            알파벳, 숫자를 하나 이상 포함하여 8자 이상의 비밀번호를 입력해주세요
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword">새 비밀번호 확인</label>
        <div className="relative">
          <input
            autoCapitalize="off"
            autoComplete="new-password"
            autoCorrect="off"
            disabled={isPending}
            enterKeyHint="done"
            id="confirmPassword"
            maxLength={64}
            minLength={8}
            name="confirmPassword"
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="새 비밀번호를 다시 입력하세요"
            required
            spellCheck={false}
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-700"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
            type="button"
          >
            {showConfirmPassword ? (
              <EyeOff className="size-5 shrink-0 text-zinc-400" />
            ) : (
              <Eye className="size-5 shrink-0 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {isTwoFactorEnabled && (
        <div>
          <label htmlFor="password-change-token">2단계 인증 코드</label>
          <OneTimeCodeInput
            className="text-base"
            disabled={isPending}
            id="password-change-token"
            onChange={(e) => setToken(e.target.value)}
            value={token}
          />
          <p className="mt-1.5 text-xs text-zinc-400">보안을 위해 인증 앱의 6자리 코드를 함께 입력해 주세요</p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
        비밀번호를 변경하면 현재 기기를 포함한 모든 로그인 세션이 종료돼요
      </div>

      <button
        className={twMerge(
          'group border-2 border-brand-gradient font-medium rounded-xl mt-2',
          'focus:outline-none focus:ring-3 focus:ring-zinc-500 disabled:border-zinc-500 disabled:text-zinc-500',
        )}
        disabled={!canSubmit || isPending}
        type="submit"
      >
        <div
          className={twMerge(
            'p-2 flex justify-center bg-zinc-900 rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900',
            'group-disabled:bg-zinc-800 group-disabled:cursor-not-allowed',
          )}
        >
          {isPending ? <Loader2 className="text-zinc-500 size-6 p-0.5 animate-spin" /> : '비밀번호 변경'}
        </div>
      </button>
    </form>
  )
}

function calculatePasswordStrength(password: string) {
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[A-Za-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return Math.min(strength, 4)
}

function getStrengthText(strength: number) {
  switch (strength) {
    case 0:
      return { text: '', color: 'text-zinc-500', barColor: 'bg-zinc-500' }
    case 1:
      return { text: '약함', color: 'text-red-500', barColor: 'bg-red-500' }
    case 2:
      return { text: '보통', color: 'text-orange-500', barColor: 'bg-orange-500' }
    case 3:
      return { text: '강함', color: 'text-yellow-500', barColor: 'bg-yellow-500' }
    case 4:
      return { text: '매우 강함', color: 'text-green-500', barColor: 'bg-green-500' }
    default:
      return { text: '', color: '', barColor: '' }
  }
}
