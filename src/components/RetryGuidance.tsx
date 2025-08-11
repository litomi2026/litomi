import { useEffect, useState } from 'react'

interface SmartRetryGuidanceProps {
  errorMessage?: string
  hasSystemIssues: boolean
}

const ERROR_PATTERNS = {
  network: /network|connection|timeout|fetch/i,
  authentication: /auth|login|credential|permission|forbidden/i,
  database: /database|query|transaction|constraint/i,
  rateLimit: /rate limit|too many requests|429/i,
}

export default function RetryGuidance({ hasSystemIssues, errorMessage = '' }: SmartRetryGuidanceProps) {
  const [guidance, setGuidance] = useState<string>('')

  useEffect(() => {
    if (hasSystemIssues) {
      setGuidance('서비스에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요.')
      return
    }

    if (ERROR_PATTERNS.network.test(errorMessage)) {
      setGuidance('네트워크 연결을 확인하고 다시 시도해주세요.')
    } else if (ERROR_PATTERNS.authentication.test(errorMessage)) {
      setGuidance('로그인이 필요하거나 권한이 없어요.')
    } else if (ERROR_PATTERNS.database.test(errorMessage)) {
      setGuidance('데이터 처리 중 문제가 발생했어요.')
    } else if (ERROR_PATTERNS.rateLimit.test(errorMessage)) {
      setGuidance('요청이 너무 많아요. 잠시 후 다시 시도해주세요.')
    } else {
      setGuidance('')
    }
  }, [hasSystemIssues, errorMessage])

  if (!guidance) {
    return null
  }

  return (
    <div className="my-3 px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
      <p className="text-xs text-zinc-300 flex items-center gap-2">
        <span className="text-zinc-500">💡</span>
        {guidance}
      </p>
    </div>
  )
}
