'use client'

type Props = {
  onNewChat: () => void
}

export function ChatHeader({ onNewChat }: Props) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold">캐릭터 AI 채팅</h1>
        <p className="text-sm text-zinc-400">모델은 내 기기에서 실행되고, 대화 기록은 계정에 저장돼요</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="text-xs text-zinc-400 underline hover:text-zinc-200 transition"
          onClick={onNewChat}
          type="button"
        >
          새 채팅
        </button>
      </div>
    </header>
  )
}
