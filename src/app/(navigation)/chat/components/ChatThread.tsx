'use client'

import { ChevronRight } from 'lucide-react'

import type { ChatMessage } from '../domain/chatMessage'

type Props = {
  characterName: string
  currentAssistantId: string | null
  input: string
  isGenerating: boolean
  messages: ChatMessage[]
  modelMode: 'chat' | 'thinking'
  onInputChange: (next: string) => void
  onStop: () => void
  onSubmit: () => void
}

export function ChatThread({
  characterName,
  currentAssistantId,
  input,
  isGenerating,
  messages,
  modelMode,
  onInputChange,
  onStop,
  onSubmit,
}: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800/60 p-4 flex flex-col gap-3 min-h-[40vh]">
      <div className="flex flex-col gap-2">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">메시지를 보내면 대화를 시작할 수 있어요</p>
        ) : (
          messages.map((m) => {
            const isCurrentAssistant = m.role === 'assistant' && m.id === currentAssistantId
            const showPlaceholder = isCurrentAssistant && isGenerating && m.content.trim().length === 0
            const placeholderText = modelMode === 'thinking' ? '생각 중이에요…' : '답변을 만들고 있어요…'
            const content = showPlaceholder ? placeholderText : m.content
            const showDebugThink = m.role === 'assistant' && modelMode === 'thinking' && Boolean(m.debug?.think?.trim())

            return (
              <div
                className="rounded-2xl px-3 py-2 border border-zinc-800/60 bg-zinc-950/60"
                data-role={m.role}
                key={m.id}
              >
                <p className="text-xs text-zinc-500 mb-1">{m.role === 'user' ? '나' : characterName}</p>
                {showDebugThink && (
                  <details className="group mt-2">
                    <summary className="cursor-pointer list-none flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition select-none [&::-webkit-details-marker]:hidden">
                      <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                      생각 과정 보기
                    </summary>
                    <div className="mt-2 rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-3 py-2">
                      <div className="max-h-48 overflow-y-auto">
                        <p className="text-xs text-zinc-300 whitespace-pre-wrap wrap-break-word leading-relaxed">
                          {m.debug?.think}
                        </p>
                      </div>
                    </div>
                  </details>
                )}
                <p
                  className="mt-2 text-sm whitespace-pre-wrap wrap-break-word data-[placeholder=true]:text-zinc-500 data-[placeholder=true]:animate-pulse"
                  data-placeholder={showPlaceholder}
                >
                  {content}
                </p>
              </div>
            )
          })
        )}
      </div>

      <form
        className="mt-auto flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <textarea
          className="min-h-24 rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
          id="message"
          name="message"
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="메시지를 입력해 주세요"
          required
          value={input}
        />
        <div className="flex items-center justify-between gap-2">
          <button
            aria-disabled={!isGenerating}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-700/60 hover:border-zinc-500 transition"
            onClick={onStop}
            type="button"
          >
            중지
          </button>
          <button
            aria-disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white transition"
            type="submit"
          >
            보내기
          </button>
        </div>
      </form>
    </section>
  )
}
