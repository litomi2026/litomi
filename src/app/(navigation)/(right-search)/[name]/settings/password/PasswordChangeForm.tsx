'use client'

import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ChangeEvent, FormEvent, useCallback, useState } from 'react'
import { toast } from 'sonner'

import { PASSWORD_PATTERN } from '@/constants/policy'
import useServerAction, { getFieldError, getFormField } from '@/hook/useServerAction'

import { changePassword } from './action'

type Props = {
  userId: number
}

export default function PasswordChangeForm({ userId }: Readonly<Props>) {
  const router = useRouter()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const strengthInfo = getStrengthText(passwordStrength)

  const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const strength = calculatePasswordStrength(e.target.value)
    setPasswordStrength(strength)
  }, [])

  const [response, dispatchAction, isPending] = useServerAction({
    action: changePassword,
    onSuccess: (data) => {
      toast.success(data)
      router.push('/auth/login')
    },
  })

  const currentPasswordError = getFieldError(response, 'currentPassword')
  const newPasswordError = getFieldError(response, 'newPassword')
  const confirmPasswordError = getFieldError(response, 'confirmPassword')
  const defaultCurrentPassword = getFormField(response, 'currentPassword')
  const defaultNewPassword = getFormField(response, 'newPassword')
  const defaultConfirmPassword = getFormField(response, 'confirmPassword')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const formElement = e.currentTarget
    const currentPassword = formElement.currentPassword.value
    const newPassword = formElement.newPassword.value
    const confirmPassword = formElement.confirmPassword.value

    if (newPassword !== confirmPassword) {
      e.preventDefault()
      toast.warning('새 비밀번호가 일치하지 않아요')
    } else if (currentPassword === newPassword) {
      e.preventDefault()
      toast.warning('현재 비밀번호와 새 비밀번호가 같아요')
    }
  }

  return (
    <form
      action={dispatchAction}
      className="grid gap-6
      [&_label]:block [&_label]:mb-1.5 [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300
      [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
      [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 
      [&_input]:focus:ring-zinc-500 [&_input]:focus:border-transparent [&_input]:disabled:bg-zinc-700 
      [&_input]:disabled:text-zinc-400 [&_input]:disabled:border-zinc-500 [&_input]:disabled:cursor-not-allowed
      [&_input]:aria-invalid:border-red-700 [&_input]:aria-invalid:focus:ring-red-700"
      onSubmit={handleSubmit}
    >
      <input name="userId" type="hidden" value={userId} />
      <div>
        <label htmlFor="currentPassword">현재 비밀번호</label>
        <div className="relative">
          <input
            aria-invalid={!!currentPasswordError}
            autoComplete="current-password"
            defaultValue={defaultCurrentPassword}
            disabled={isPending}
            id="currentPassword"
            name="currentPassword"
            placeholder="현재 비밀번호를 입력하세요"
            required
            type={showCurrentPassword ? 'text' : 'password'}
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
        {currentPasswordError && <p className="mt-1 text-xs text-red-500">{currentPasswordError}</p>}
      </div>
      <div>
        <label htmlFor="newPassword">새 비밀번호</label>
        <div className="relative">
          <input
            aria-invalid={!!newPasswordError}
            autoComplete="new-password"
            defaultValue={defaultNewPassword}
            disabled={isPending}
            id="newPassword"
            maxLength={64}
            minLength={8}
            name="newPassword"
            onChange={handlePasswordChange}
            pattern={PASSWORD_PATTERN}
            placeholder="새 비밀번호를 입력하세요"
            required
            type={showNewPassword ? 'text' : 'password'}
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
        {newPasswordError ? (
          <p className="mt-1.5 text-xs text-red-500">{newPasswordError}</p>
        ) : strengthInfo.text ? (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1 h-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  className={`flex-1 rounded-full transition-all ${
                    level <= passwordStrength ? strengthInfo.barColor : 'bg-zinc-700'
                  }`}
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
            aria-invalid={!!confirmPasswordError}
            autoComplete="new-password"
            defaultValue={defaultConfirmPassword}
            disabled={isPending}
            id="confirmPassword"
            maxLength={64}
            minLength={8}
            name="confirmPassword"
            placeholder="새 비밀번호를 다시 입력하세요"
            required
            type={showConfirmPassword ? 'text' : 'password'}
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
        {confirmPasswordError && <p className="mt-1 text-xs text-red-500">{confirmPasswordError}</p>}
      </div>

      <button
        className="group border-2 border-brand-gradient font-medium rounded-xl focus:outline-none focus:ring-3 focus:ring-zinc-500
        disabled:border-zinc-500 disabled:pointer-events-none disabled:text-zinc-500 mt-2"
        disabled={isPending}
        type="submit"
      >
        <div
          className="p-2 flex justify-center bg-zinc-900 rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900 
          group-disabled:bg-zinc-800 group-disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="text-zinc-500 size-6 p-0.5 animate-spin" /> : '비밀번호 변경'}
        </div>
      </button>
    </form>
  )
}

const calculatePasswordStrength = (password: string) => {
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[A-Za-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return Math.min(strength, 4)
}

const getStrengthText = (strength: number) => {
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
