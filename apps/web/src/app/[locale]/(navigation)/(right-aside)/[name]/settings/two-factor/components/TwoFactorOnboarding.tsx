'use client'

import { useMutation } from '@tanstack/react-query'
import { RectangleEllipsis } from 'lucide-react'

import StatusState from '@/components/status/StatusState'
import { getStatusActionClassName } from '@/components/status/styles'

import type { TwoFactorSetupData } from '../types'

import { requestTwoFactorSetup } from '../api'

type Props = {
  onSuccess: (data: TwoFactorSetupData) => void
}

export default function TwoFactorOnboarding({ onSuccess }: Props) {
  const setupMutation = useMutation({
    mutationFn: requestTwoFactorSetup,
    onSuccess,
  })

  return (
    <StatusState
      description="인증 앱을 통해 계정을 이중으로 보호하세요"
      icon={<RectangleEllipsis className="size-8" />}
      intent="setup"
      title="2단계 인증이 꺼져있어요"
    >
      <button
        className={getStatusActionClassName('primary')}
        disabled={setupMutation.isPending}
        onClick={() => setupMutation.mutate()}
        type="button"
      >
        {setupMutation.isPending ? 'QR 코드 생성하는 중' : '2단계 인증 시작하기'}
      </button>
    </StatusState>
  )
}
