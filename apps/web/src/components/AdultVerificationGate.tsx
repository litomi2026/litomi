import { ShieldAlert } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

type Props = {
  title?: string
  description?: string
}

export default function AdultVerificationGate({
  title = '성인인증이 필요해요',
  description = '성인인증을 완료하면 이 기능을 사용할 수 있어요',
}: Props) {
  return (
    <StatusState description={description} icon={<ShieldAlert className="size-8" />} intent="verify" title={title}>
      <StatusActionLink href="/settings#adult">익명으로 성인인증하기</StatusActionLink>
    </StatusState>
  )
}
