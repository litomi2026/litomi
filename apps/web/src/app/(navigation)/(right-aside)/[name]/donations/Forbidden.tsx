import { LockKeyhole } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

type Props = {
  loginUsername: string
}

export default function Forbidden({ loginUsername }: Props) {
  return (
    <StatusState
      description="본인의 내 후원 페이지만 접근할 수 있어요"
      headingLevel={1}
      icon={<LockKeyhole className="size-8" />}
      title="접근 권한이 없어요"
    >
      <StatusActionLink href={`/@${loginUsername}/donations`}>내 후원으로 가기</StatusActionLink>
    </StatusState>
  )
}
