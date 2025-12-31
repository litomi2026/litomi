import { ProblemDetailsError } from '@/utils/react-query-error'

type Props = {
  rewardEnabled: boolean
  apiError: unknown | null
  isLoading: boolean
  cooldownLabel: string | null
  dailyRemaining: number | null
  onRetry: () => void
}

export default function RewardedAdFooter({
  rewardEnabled,
  apiError,
  isLoading,
  cooldownLabel,
  dailyRemaining,
  onRetry,
}: Props) {
  return (
    <div className="text-xs h-5 flex items-center justify-center">
      {rewardEnabled && apiError ? (
        <div className="text-center">
          <span className="text-amber-500">
            {apiError instanceof ProblemDetailsError ? apiError.message : '오류가 발생했어요'}
            <span className="tabular-nums">{cooldownLabel && ` (${cooldownLabel})`}</span>
          </span>
          {apiError instanceof ProblemDetailsError &&
            !apiError.message.includes('한도') &&
            !apiError.message.includes('잠시 후') && (
              <button className="ml-2 text-zinc-300 underline" disabled={isLoading} onClick={onRetry}>
                다시 시도
              </button>
            )}
        </div>
      ) : rewardEnabled && dailyRemaining !== null ? (
        dailyRemaining > 0 ? (
          <span className="text-zinc-500">오늘 남은 적립: {dailyRemaining} 리보</span>
        ) : (
          <span className="text-amber-500">오늘의 적립 한도에 도달했어요</span>
        )
      ) : null}
    </div>
  )
}
