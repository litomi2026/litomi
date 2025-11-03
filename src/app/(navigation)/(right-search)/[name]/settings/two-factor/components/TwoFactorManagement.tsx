'use client'

import dayjs from 'dayjs'
import { useState } from 'react'
import { toast } from 'sonner'

import IconSpinner from '@/components/icons/IconSpinner'
import useActionResponse, { getFormField } from '@/hook/useActionResponse'

import type { TwoFactorStatus } from '../types'

import { regenerateBackupCodes, removeTwoFactor } from '../actions'
import OneTimeCodeInput from './OneTimeCodeInput'
import TrustedBrowsers from './TrustedBrowsers'

interface DisableConfirmationProps {
  onCancel: () => void
  onSuccess: () => void
}

interface Props {
  onBackupCodesChange: (codes: string[]) => void
  onStatusChange: (status: null) => void
  status: TwoFactorStatus
}

interface RegenerateBackupCodesFormProps {
  onCancel: () => void
  onSuccess: (backupCodes: string[]) => void
}

export default function TwoFactorManagement({ onBackupCodesChange, onStatusChange, status }: Props) {
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const { remainingBackupCodes, createdAt, lastUsedAt, trustedBrowsers } = status

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">2단계 인증 (2FA)</h2>
        <div className="rounded-full bg-green-900/20 px-2.5 py-1 text-xs font-medium text-green-500">활성화</div>
      </div>
      <div className="rounded-lg bg-zinc-900 p-4 space-y-2">
        {createdAt && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">활성화 일시</span>
            <span className="text-zinc-300" title={dayjs(createdAt).format('YYYY년 M월 D일 HH:mm')}>
              {dayjs(createdAt).format('YYYY년 M월 D일')}
            </span>
          </div>
        )}
        {lastUsedAt && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">마지막 사용</span>
            <span className="text-zinc-300" title={dayjs(lastUsedAt).format('YYYY년 M월 D일 HH:mm')}>
              {dayjs(lastUsedAt).format('YYYY년 M월 D일')}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">남은 복구 코드</span>
          <span className="text-zinc-300">{remainingBackupCodes}개</span>
        </div>
      </div>
      {remainingBackupCodes < 3 && (
        <div className="rounded-lg bg-yellow-900/20 border border-yellow-800 p-4">
          <p className="text-sm text-yellow-500">
            복구 코드가 {remainingBackupCodes}개만 남았어요. 새로운 복구 코드를 생성하는 것을 권장합니다.
          </p>
        </div>
      )}
      {!showDisableConfirm && !showRegenerateModal && (
        <div className="space-y-3">
          <button
            className="w-full rounded-lg bg-red-900/20 border border-red-900 px-4 py-3 font-medium text-red-500 hover:bg-red-900/30"
            onClick={() => setShowDisableConfirm(true)}
          >
            2단계 인증 비활성화
          </button>
          <button
            className="w-full rounded-lg bg-zinc-800 px-4 py-3 font-medium text-zinc-100 hover:bg-zinc-700"
            onClick={() => setShowRegenerateModal(true)}
          >
            복구 코드 재생성
          </button>
        </div>
      )}
      {showDisableConfirm && (
        <DisableConfirmation
          onCancel={() => setShowDisableConfirm(false)}
          onSuccess={() => {
            onStatusChange(null)
            setShowDisableConfirm(false)
            toast.info('2단계 인증이 비활성화됐어요')
          }}
        />
      )}
      {showRegenerateModal && (
        <RegenerateBackupCodesForm
          onCancel={() => setShowRegenerateModal(false)}
          onSuccess={(backupCodes) => {
            onBackupCodesChange(backupCodes)
            setShowRegenerateModal(false)
            toast.success('새로운 복구 코드를 생성했어요')
          }}
        />
      )}
      <div className="mt-8 border-t border-zinc-800 pt-8">
        <TrustedBrowsers trustedBrowsers={trustedBrowsers || []} />
      </div>
    </div>
  )
}

function DisableConfirmation({ onSuccess, onCancel }: DisableConfirmationProps) {
  const [response, disableAction, isDisabling] = useActionResponse({
    action: removeTwoFactor,
    onSuccess,
  })

  const defaultToken = getFormField(response, 'token')

  return (
    <form action={disableAction} className="grid gap-3">
      <div className="rounded-lg bg-red-900/20 border border-red-900 p-4">
        <p className="text-sm text-red-500">2단계 인증을 비활성화하면 계정 보안이 약해져요. 계속할까요?</p>
      </div>
      <OneTimeCodeInput defaultValue={defaultToken} />
      <div className="flex gap-3">
        <button
          className="flex-1 rounded-lg bg-red-900 px-4 py-3 font-medium text-foreground transition
          hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isDisabling}
          type="submit"
        >
          {isDisabling ? <IconSpinner className="size-4 mx-auto" /> : '비활성화'}
        </button>
        <button
          className="flex-1 rounded-lg bg-zinc-800 px-4 py-3 font-medium text-zinc-100 transition
          hover:bg-zinc-700"
          onClick={onCancel}
        >
          취소
        </button>
      </div>
    </form>
  )
}

function RegenerateBackupCodesForm({ onCancel, onSuccess }: RegenerateBackupCodesFormProps) {
  const [response, regenerateAction, isRegenerating] = useActionResponse({
    action: regenerateBackupCodes,
    onSuccess,
  })

  const defaultToken = getFormField(response, 'token')

  return (
    <form action={regenerateAction} className="grid gap-3">
      <div className="rounded-lg bg-yellow-900/20 border border-yellow-800 p-4">
        <p className="text-sm text-yellow-500">
          새로운 복구 코드를 생성하면 기존 복구 코드는 모두 무효화돼요. 계속할까요?
        </p>
      </div>
      <OneTimeCodeInput defaultValue={defaultToken} />
      <div className="flex gap-3">
        <button
          className="flex-1 rounded-lg bg-brand px-4 py-3 font-medium text-background transition
          hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isRegenerating}
          type="submit"
        >
          {isRegenerating ? <IconSpinner className="size-4 mx-auto" /> : '재생성'}
        </button>
        <button
          className="flex-1 rounded-lg bg-zinc-800 px-4 py-3 font-medium text-zinc-100 transition
          hover:bg-zinc-700"
          onClick={onCancel}
        >
          취소
        </button>
      </div>
    </form>
  )
}
