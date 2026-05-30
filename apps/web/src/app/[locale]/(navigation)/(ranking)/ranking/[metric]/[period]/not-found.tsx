import { Trophy } from 'lucide-react'

import StatusState, { StatusActionLink } from '@/components/status/StatusState'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '../../../common'

export default function NotFound() {
  return (
    <StatusState
      description="요청한 기간 또는 기준에 표시할 작품이 없어요"
      icon={<Trophy className="size-8" />}
      title="랭킹을 찾을 수 없어요"
    >
      <StatusActionLink href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`}>기본 랭킹으로 가기</StatusActionLink>
    </StatusState>
  )
}
