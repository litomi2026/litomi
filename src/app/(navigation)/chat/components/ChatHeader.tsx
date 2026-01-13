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
          모델은 내 기기에서 실행되고, 대화 기록은 계정에 저장돼요. 현재는 베타 버전이라서 안정적이지 않아요.
        </p>
      </div>
    </header>
  )
}
