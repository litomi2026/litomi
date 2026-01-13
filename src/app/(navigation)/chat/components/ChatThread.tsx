'use client'

import type { FormEvent, ReactNode } from 'react'

import { ChevronRight } from 'lucide-react'

import type { ChatMessage } from '../types/chatMessage'

type Props = {
  canContinue: boolean
  chatInputDisabled: boolean
  chatInputDisabledReason: string | null
  characterName: string
  currentAssistantId: string | null
  input: string
  isGenerating: boolean
  isPreparingModel: boolean
  isThinkingEnabled: boolean
  messages: ChatMessage[]
  modelMode: 'chat' | 'thinking'
  showThinkingTrace: boolean
  onContinue: () => void
  onInputChange: (next: string) => void
  onStop: () => void
  onSubmit: () => void
}

export function ChatThread({
  canContinue,
  chatInputDisabled,
  chatInputDisabledReason,
  characterName,
  currentAssistantId,
  input,
  isGenerating,
  isPreparingModel,
  isThinkingEnabled,
  messages,
  modelMode,
  showThinkingTrace,
  onContinue,
  onInputChange,
  onStop,
  onSubmit,
}: Props) {
  const introText = getIntroText(chatInputDisabled, chatInputDisabledReason)
  const placeholderText = getPlaceholderText({ isPreparingModel, isThinkingEnabled, modelMode })
  const showContinueButton = canContinue && !isGenerating && !chatInputDisabled && input.trim().length === 0

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit()
  }

  return (
    <section className="rounded-2xl border border-white/7 bg-white/3 p-4 flex flex-col gap-3 min-h-[40vh] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex flex-col gap-2">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">{introText}</p>
        ) : (
          messages.map((m) => {
            const isCurrentAssistant = m.role === 'assistant' && m.id === currentAssistantId
            const showPlaceholder = isCurrentAssistant && isGenerating && m.content.trim().length === 0
            const content = showPlaceholder ? placeholderText : m.content
            const showDebugThink =
              showThinkingTrace && m.role === 'assistant' && modelMode === 'thinking' && Boolean(m.debug?.think?.trim())

            return (
              <div className="rounded-2xl px-3 py-2 border border-white/7 bg-white/2" data-role={m.role} key={m.id}>
                <p className="text-xs text-zinc-500 mb-1">{m.role === 'user' ? '나' : characterName}</p>
                {showDebugThink && (
                  <details className="group mt-2">
                    <summary className="cursor-pointer list-none flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition select-none [&::-webkit-details-marker]:hidden">
                      <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                      생각 과정 보기
                    </summary>
                    <div className="mt-2 rounded-xl border border-white/7 bg-white/2 px-3 py-2">
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
                  {renderBoldMarkdown(content)}
                </p>
              </div>
            )
          })
        )}
      </div>

      <form className="mt-auto flex flex-col gap-2" onSubmit={handleSubmit}>
        <textarea
          aria-disabled={chatInputDisabled}
          className="min-h-24 text-base rounded-2xl border border-white/7 bg-white/2 px-3 py-2 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          disabled={chatInputDisabled}
          id="message"
          name="message"
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={chatInputDisabledReason ?? '메시지를 입력해 주세요'}
          required
          value={input}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              aria-disabled={!isGenerating}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/7 hover:border-white/15 transition aria-disabled:opacity-50 aria-disabled:pointer-events-none"
              disabled={!isGenerating}
              onClick={onStop}
              type="button"
            >
              중지
            </button>
            {showContinueButton ? (
              <button
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/7 hover:border-white/15 transition text-zinc-200"
                onClick={onContinue}
                type="button"
              >
                계속해 줘요
              </button>
            ) : null}
          </div>
          <button
            aria-disabled={isGenerating || chatInputDisabled}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white transition aria-disabled:opacity-50 aria-disabled:pointer-events-none"
            disabled={isGenerating || chatInputDisabled}
            type="submit"
          >
            보내기
          </button>
        </div>
      </form>
    </section>
  )
}

function getIntroText(chatInputDisabled: boolean, chatInputDisabledReason: string | null): string {
  if (chatInputDisabled) {
    return chatInputDisabledReason ?? '모델을 준비하고 있어요…'
  }
  return '메시지를 보내면 대화를 시작할 수 있어요'
}

function getPlaceholderText(options: {
  isPreparingModel: boolean
  isThinkingEnabled: boolean
  modelMode: 'chat' | 'thinking'
}) {
  const { isPreparingModel, isThinkingEnabled, modelMode } = options
  if (isPreparingModel) return '모델을 준비하고 있어요…'
  if (modelMode === 'thinking' && isThinkingEnabled) return '생각 중이에요…'
  return '답변을 만들고 있어요…'
}

// NOTE: 메시지 렌더링이 "**굵게**" 정도만 필요하면 이 간단 파서로 충분해요.
// NOTE: 링크/리스트/코드블록 등 Markdown 범위가 늘어나면 `react-markdown`(+ `remark-gfm`) 같은 라이브러리로 교체하는 게 더 유지보수하기 좋아요.
function renderBoldMarkdown(text: string): ReactNode {
  const nodes: ReactNode[] = []
  let cursor = 0
  let key = 0

  while (cursor < text.length) {
    const open = text.indexOf('**', cursor)
    if (open === -1) {
      nodes.push(text.slice(cursor))
      break
    }

    const close = text.indexOf('**', open + 2)
    if (close === -1) {
      nodes.push(text.slice(cursor))
      break
    }

    if (open > cursor) {
      nodes.push(text.slice(cursor, open))
    }

    const boldText = text.slice(open + 2, close)
    if (boldText.length === 0) {
      // Preserve literals like "****"
      nodes.push(text.slice(open, close + 2))
    } else {
      nodes.push(
        <strong className="font-semibold" key={key}>
          {boldText}
        </strong>,
      )
      key += 1
    }

    cursor = close + 2
  }

  return nodes
}
