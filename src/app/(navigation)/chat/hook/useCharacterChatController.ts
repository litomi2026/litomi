'use client'

import ms from 'ms'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import type { CharacterDefinition } from '../domain/characters'
import type { ChatMessage } from '../domain/chatMessage'
import type { SupportedModelId, WebLLMEngine } from '../lib/webllm'

import { archiveChatMessages } from '../storage/indexeddb'
import { enqueueAppendMessages, enqueueCreateSession } from '../storage/outbox'

type SetStateAction<T> = T | ((prev: T) => T)

const MAX_TURNS_FOR_CONTEXT = 30
const TARGET_TURNS_AFTER_SUMMARY = 20
const MAX_MESSAGES_IN_MEMORY = MAX_TURNS_FOR_CONTEXT * 2
const TARGET_MESSAGES_AFTER_SUMMARY = TARGET_TURNS_AFTER_SUMMARY * 2
const DEFAULT_MAX_TOKENS = 256

export function useCharacterChatController(options: {
  character: CharacterDefinition | undefined
  engineRef: { current: WebLLMEngine | null }
  ensureEngine: () => Promise<WebLLMEngine>
  interruptGenerate: () => void
  isThinkingEnabled: boolean
  modelId: SupportedModelId
  modelMode: 'chat' | 'thinking'
  onOutboxFlush: () => void
  resetChat: () => void
}) {
  const {
    character,
    engineRef,
    ensureEngine,
    interruptGenerate,
    isThinkingEnabled,
    modelId,
    modelMode,
    onOutboxFlush,
    resetChat,
  } = options

  const [messages, setMessages, messagesRef] = useStateWithRef<ChatMessage[]>([])
  const [input, setInput, inputRef] = useStateWithRef('')
  const [isGenerating, setIsGenerating, isGeneratingRef] = useStateWithRef(false)
  const summaryRef = useRef<string | null>(null)
  const clientSessionIdRef = useRef<string>(crypto.randomUUID())
  const lastAssistantIdRef = useRef<string | null>(null)
  const isSummarizingRef = useRef(false)
  const pendingSummarizeRef = useRef(false)
  const scheduledSummarizeIdRef = useRef<number | null>(null)
  const scheduleSummarizeRef = useRef<() => void>(() => {})
  const lastUserActivityAtRef = useRef<number>(Date.now())

  const isLocked = messages.length > 0

  function markUserActivity() {
    lastUserActivityAtRef.current = Date.now()
  }

  function cancelScheduledSummarize() {
    const id = scheduledSummarizeIdRef.current
    if (id === null) return
    scheduledSummarizeIdRef.current = null
    if (typeof window === 'undefined') return
    if (typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(id)
    } else {
      window.clearTimeout(id)
    }
  }

  async function runSummarizeIfNeeded() {
    if (!pendingSummarizeRef.current) return
    if (isSummarizingRef.current) return
    if (isGeneratingRef.current) {
      scheduleSummarizeRef.current()
      return
    }

    if (inputRef.current.trim().length > 0) {
      scheduleSummarizeRef.current()
      return
    }

    if (Date.now() - lastUserActivityAtRef.current < ms('2s')) {
      scheduleSummarizeRef.current()
      return
    }

    const currentMessages = messagesRef.current
    if (currentMessages.length < MAX_MESSAGES_IN_MEMORY) {
      pendingSummarizeRef.current = false
      return
    }

    const engine = engineRef.current
    if (!engine) {
      scheduleSummarizeRef.current()
      return
    }

    const pruneCount = currentMessages.length - TARGET_MESSAGES_AFTER_SUMMARY
    const chunk = currentMessages.slice(0, pruneCount)
    if (chunk.length === 0) {
      pendingSummarizeRef.current = false
      return
    }

    isSummarizingRef.current = true
    try {
      const prompt = buildSummaryPrompt({ currentSummary: summaryRef.current, newMessages: chunk })

      const res = await engine.chat.completions.create({
        messages: prompt,
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: DEFAULT_MAX_TOKENS,
      })

      const text = res.choices[0]?.message?.content?.trim()
      if (!text) {
        scheduleSummarizeRef.current()
        return
      }

      const sessionId = clientSessionIdRef.current
      const nowMs = Date.now()
      await archiveChatMessages(
        chunk.map((m) => ({
          id: `archived:${sessionId}:${m.id}`,
          clientMessageId: m.id,
          clientSessionId: sessionId,
          content: m.content,
          createdAtMs: nowMs,
          debugThink: m.debug?.think,
          role: m.role,
        })),
      )

      pendingSummarizeRef.current = false
      summaryRef.current = text
      setMessages((prev) => prev.slice(pruneCount))
    } catch {
      scheduleSummarizeRef.current()
    } finally {
      isSummarizingRef.current = false
    }
  }

  function scheduleSummarize() {
    if (scheduledSummarizeIdRef.current !== null) return
    if (typeof window === 'undefined') return

    const schedule = (cb: () => void) => {
      if (typeof window.requestIdleCallback === 'function') {
        return window.requestIdleCallback(cb, { timeout: ms('1s') })
      }
      return window.setTimeout(cb, ms('500ms'))
    }

    scheduledSummarizeIdRef.current = schedule(() => {
      scheduledSummarizeIdRef.current = null
      void runSummarizeIfNeeded()
    })
  }

  scheduleSummarizeRef.current = scheduleSummarize

  function onInputChange(next: string) {
    markUserActivity()
    cancelScheduledSummarize()
    setInput(next)
  }

  function stop() {
    markUserActivity()
    lastAssistantIdRef.current = null
    interruptGenerate()
  }

  function newChat() {
    markUserActivity()
    cancelScheduledSummarize()
    pendingSummarizeRef.current = false
    isSummarizingRef.current = false
    lastAssistantIdRef.current = null

    setMessages([])
    summaryRef.current = null
    clientSessionIdRef.current = crypto.randomUUID()
    resetChat()
  }

  async function send() {
    if (!character) return
    if (!inputRef.current.trim()) return
    if (isGeneratingRef.current) return

    markUserActivity()
    cancelScheduledSummarize()

    const text = inputRef.current.trim()
    setInput('')

    const prevMessages = messagesRef.current

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }

    const assistantId = crypto.randomUUID()
    lastAssistantIdRef.current = assistantId

    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setIsGenerating(true)

    try {
      const engine = await ensureEngine()

      const context = buildContext({
        systemPrompt: character.systemPrompt,
        messages: [...prevMessages, userMessage],
        maxTurns: MAX_TURNS_FOR_CONTEXT,
        summary: summaryRef.current,
      })

      const stream = await engine.chat.completions.create({
        messages: context,
        stream: true,
        // NOTE: 반복 루프(같은 문장/구절 무한 반복)를 줄이기 위한 설정이에요.
        temperature: modelMode === 'thinking' ? 0.25 : 0.4,
        top_p: modelMode === 'thinking' ? 0.85 : 0.9,
        max_tokens: DEFAULT_MAX_TOKENS,
        repetition_penalty: modelMode === 'thinking' ? 1.08 : 1.03,
        frequency_penalty: modelMode === 'thinking' ? 0.2 : 0.1,
        presence_penalty: modelMode === 'thinking' ? 0.1 : 0.0,
        ...(modelMode === 'thinking' && !isThinkingEnabled && { extra_body: { enable_thinking: false } }),
      })

      const openTag = '<think>'
      const closeTag = '</think>'

      let rafId: number | null = null
      let scheduledVisible: string | null = null

      let visible = ''
      let buffer = ''
      let insideThink = false
      let thinkBuffer = ''
      const thinkParts: string[] = []

      function scheduleAssistantVisibleUpdate(nextVisible: string) {
        scheduledVisible = nextVisible
        if (rafId !== null) return
        rafId = window.requestAnimationFrame(() => {
          rafId = null
          if (lastAssistantIdRef.current !== assistantId) return
          const v = scheduledVisible
          if (v === null) return
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.id === assistantId) {
              const next = prev.slice()
              next[next.length - 1] = { ...last, content: v }
              return next
            }
            const idx = prev.findIndex((m) => m.id === assistantId)
            if (idx === -1) return prev
            const next = prev.slice()
            next[idx] = { ...next[idx], content: v }
            return next
          })
        })
      }

      function consumeThinkingDelta(delta: string) {
        let text = buffer + delta
        buffer = ''

        while (text.length > 0) {
          if (!insideThink) {
            const openIndex = text.indexOf(openTag)
            if (openIndex === -1) {
              const keepFrom = Math.max(0, text.length - (openTag.length - 1))
              const visiblePart = text.slice(0, keepFrom)
              if (visible.length === 0 && visiblePart.length > 0) {
                visible += visiblePart.trimStart()
              } else {
                visible += visiblePart
              }
              buffer = text.slice(keepFrom)
              return
            }

            const visiblePart = text.slice(0, openIndex)
            if (visible.length === 0 && visiblePart.length > 0) {
              visible += visiblePart.trimStart()
            } else {
              visible += visiblePart
            }

            text = text.slice(openIndex + openTag.length)
            insideThink = true
            continue
          }

          const closeIndex = text.indexOf(closeTag)
          if (closeIndex === -1) {
            const keepFrom = Math.max(0, text.length - (closeTag.length - 1))
            thinkBuffer += text.slice(0, keepFrom)
            buffer = text.slice(keepFrom)
            return
          }

          thinkBuffer += text.slice(0, closeIndex)
          const trimmed = thinkBuffer.trim()
          if (trimmed) {
            thinkParts.push(trimmed)
          }
          thinkBuffer = ''

          text = text.slice(closeIndex + closeTag.length)
          insideThink = false
        }
      }

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        if (!delta) continue
        if (lastAssistantIdRef.current !== assistantId) break

        if (modelMode === 'thinking') {
          consumeThinkingDelta(delta)
        } else {
          visible += delta
        }

        scheduleAssistantVisibleUpdate(visible)
      }

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }

      if (modelMode === 'thinking' && thinkBuffer.trim()) {
        thinkParts.push(thinkBuffer.trim())
      }

      const assistantContent = visible
      const assistantThink = thinkParts.filter(Boolean).join('\n\n')
      const hasAssistantContent = assistantContent.trim().length > 0
      const finalMessages = hasAssistantContent
        ? [...prevMessages, userMessage, { ...assistantMessage, content: assistantContent }]
        : [...prevMessages, userMessage]

      const sessionId = clientSessionIdRef.current
      await enqueueCreateSession({
        clientSessionId: sessionId,
        characterKey: character.key,
        characterName: character.name,
        systemPrompt: character.systemPrompt,
        modelId,
      })

      if (!hasAssistantContent) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } else if (assistantThink) {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.id === assistantId) {
            const next = prev.slice()
            next[next.length - 1] = { ...last, debug: { think: assistantThink } }
            return next
          }
          const idx = prev.findIndex((m) => m.id === assistantId)
          if (idx === -1) return prev
          const next = prev.slice()
          next[idx] = { ...next[idx], debug: { think: assistantThink } }
          return next
        })
      }

      const outboxMessages: { clientMessageId: string; role: 'assistant' | 'user'; content: string }[] = [
        { clientMessageId: userMessage.id, role: 'user', content: userMessage.content },
      ]

      if (hasAssistantContent) {
        outboxMessages.push({ clientMessageId: assistantId, role: 'assistant', content: assistantContent })
      }

      await enqueueAppendMessages({
        clientSessionId: sessionId,
        messages: outboxMessages,
      })

      onOutboxFlush()

      if (hasAssistantContent && finalMessages.length >= MAX_MESSAGES_IN_MEMORY) {
        pendingSummarizeRef.current = true
        scheduleSummarize()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '응답을 생성하지 못했어요')
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    currentAssistantId: lastAssistantIdRef.current,
    input,
    isGenerating,
    isLocked,
    messages,
    newChat,
    onInputChange,
    send,
    stop,
  }
}

function buildContext(options: {
  systemPrompt: string
  messages: ChatMessage[]
  maxTurns: number
  summary: string | null
}) {
  const { systemPrompt, messages, maxTurns, summary } = options

  const recent = messages.slice(-maxTurns * 2)
  const system = summary
    ? `${systemPrompt}\n\n[이전 대화 요약]\n${summary}\n\n(요약을 참고해서 대화를 이어가 주세요.)`
    : systemPrompt

  return [{ role: 'system' as const, content: system }, ...recent.map((m) => ({ role: m.role, content: m.content }))]
}

function buildSummaryPrompt(options: { currentSummary: string | null; newMessages: ChatMessage[] }) {
  const { currentSummary, newMessages } = options

  const transcript = newMessages
    .map((m) => {
      const speaker = m.role === 'user' ? '사용자' : '어시스턴트'
      return `${speaker}: ${m.content}`
    })
    .join('\n')

  const system = [
    '너는 대화 내용을 짧게 요약해서 "메모리"로 정리하는 역할이야.',
    '반드시 한국어로 작성해.',
    '길게 쓰지 말고, 다음 대화에서 도움이 될 핵심 정보만 남겨.',
    '- 인물/호칭/관계(예: 선생님/아리스)',
    '- 사용자의 목표/선호/금기',
    '- 진행 중인 계획/약속/해야 할 일',
    '형식은 8~12줄 이내의 불릿 리스트로 해.',
  ].join('\n')

  const user = currentSummary
    ? `현재 메모리가 있어요:\n${currentSummary}\n\n아래 대화를 반영해서 메모리를 업데이트해 주세요:\n${transcript}`
    : `아래 대화를 메모리로 요약해 주세요:\n${transcript}`

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ]
}

function useStateWithRef<T>(initial: T | (() => T)) {
  const [state, setState] = useState<T>(initial)
  const ref = useRef(state)

  function set(action: SetStateAction<T>) {
    setState((prev) => {
      const next = typeof action === 'function' ? (action as (p: T) => T)(prev) : action
      ref.current = next
      return next
    })
  }

  return [state, set, ref] as const
}
