import { KeyRound, RectangleEllipsis, ShieldCheck, Smartphone } from 'lucide-react'

import useServerAction from '@/hook/useServerAction'

import Onboarding from '../../Onboarding'
import { setupTwoFactor } from '../actions'
import { TwoFactorSetupData } from '../types'

type Props = {
  onSuccess: (data: TwoFactorSetupData) => void
}

export default function TwoFactorOnboarding({ onSuccess }: Props) {
  const [_, setupAction, isSettingUp] = useServerAction({
    action: setupTwoFactor,
    onSuccess,
    shouldSetResponse: false,
  })

  return (
    <Onboarding
      benefits={[
        {
          icon: <ShieldCheck className="size-5" />,
          title: '계정 탈취 방지',
          description: '비밀번호가 유출되어도 안전해요',
        },
        {
          icon: <Smartphone className="size-5" />,
          title: '간편한 인증',
          description: '모바일 앱으로 30초마다 6자리 숫자가 생성돼요',
        },
        {
          icon: <KeyRound className="size-5" />,
          title: '복구 코드 제공',
          description: '휴대폰을 잃어버려도 로그인할 수 있어요',
        },
      ]}
      description="인증 앱을 통해 계정을 이중으로 보호하세요"
      icon={<RectangleEllipsis className="size-12 text-brand" />}
      title="2단계 인증이 꺼져있어요"
    >
      <button
        className="px-6 py-3 rounded-2xl bg-brand font-semibold text-background hover:opacity-80 transition disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSettingUp}
        onClick={() => setupAction()}
      >
        {isSettingUp ? 'QR 코드 생성하는 중' : '2단계 인증 시작하기'}
      </button>
    </Onboarding>
  )
}
