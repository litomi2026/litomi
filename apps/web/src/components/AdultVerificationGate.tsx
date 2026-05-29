import { ShieldAlert } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

type Props = {
  username?: string
  title?: string
  description?: string
}

export default function AdultVerificationGate({
  username,
  title = '성인인증이 필요해요',
  description = '성인인증을 완료하면 이 기능을 사용할 수 있어요',
}: Props) {
  const settingsHref = username ? `/@${username}/settings#adult` : null

  return (
    <StatusState description={description} icon={<ShieldAlert className="size-8" />} intent="verify" title={title}>
      {settingsHref ? (
        <StatusActionLink href={settingsHref}>익명으로 성인인증하기</StatusActionLink>
      ) : (
        <p className="text-sm text-zinc-500">설정에서 익명 성인인증을 완료해 주세요</p>
      )}
    </StatusState>
  )
}
