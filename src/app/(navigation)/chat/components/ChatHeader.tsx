'use client'

type Props = {
  onNewChat: () => void
}

export function ChatHeader({ onNewChat }: Props) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center justify-between gap-2 w-full">
          <h1 className="text-lg font-semibold">캐릭터 AI 채팅 (베타)</h1>
          <button
            className="text-xs text-zinc-400 underline hover:text-zinc-200 transition whitespace-nowrap"
            onClick={onNewChat}
            type="button"
          >
            새 채팅
          </button>
        </div>
        <p className="text-xs text-zinc-400">
          로컬에서 실행되는 AI 모델로 검열 없이 자유롭게 대화하세요. 현재는 베타 버전이니 참고해 주세요.
        </p>
      </div>
    </header>
  )
}
