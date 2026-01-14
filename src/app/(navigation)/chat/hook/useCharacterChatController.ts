'use client'

import type { WebWorkerMLCEngine } from '@mlc-ai/web-llm'

import ms from 'ms'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import type { ModelId } from '../storage/webllmModels'
import type { CharacterDefinition } from '../types/characterDefinition'
import type { ChatMessage } from '../types/chatMessage'

import { archiveChatMessages } from '../storage/indexeddb'
import { enqueueAppendMessages, enqueueCreateSession } from '../storage/outbox'
import { buildContext, buildSummaryPrompt } from '../util/chatPrompts'
import { countHistoryTokens, pickPruneCountByTokenBudget } from '../util/chatTokens'
import { getTokenBudget, type TokenBudget } from '../util/tokenBudget'
import { useStateWithRef } from './useStateWithRef'

const SUMMARY_MAX_TOKENS = 256
const CHAT_REPLY_MAX_TOKENS = 512
const THINKING_REPLY_MAX_TOKENS = 1024
const MIN_MESSAGES_TO_KEEP_AFTER_SUMMARY = 8

const DEFAULT_LLM_PARAMS = {
  chat: {
    temperature: 0.4,
    top_p: 0.85,
    max_tokens: CHAT_REPLY_MAX_TOKENS,
    repetition_penalty: 1.1,
    frequency_penalty: 0.25,
    presence_penalty: 0.2,
  },
  thinking: {
    temperature: 0.25,
    top_p: 0.85,
    max_tokens: THINKING_REPLY_MAX_TOKENS,
    repetition_penalty: 1.08,
    frequency_penalty: 0.2,
    presence_penalty: 0.2,
  },
}

type Options = {
  character: CharacterDefinition
  engineRef: { current: WebWorkerMLCEngine | null }
  ensureEngine: () => Promise<WebWorkerMLCEngine>
  interruptGenerate: () => void
  modelId: ModelId
  modelContextWindowSize?: number
  modelMode: 'chat' | 'thinking'
  modelSupportsThinking: boolean
  onOutboxFlush: () => void
  resetChat: () => void
}

export function useCharacterChatController({
  character,
  engineRef,
  ensureEngine,
  interruptGenerate,
  modelId,
  modelContextWindowSize,
  modelMode,
  modelSupportsThinking,
  onOutboxFlush,
  resetChat,
}: Options) {
  const [messages, setMessages, messagesRef] = useStateWithRef<ChatMessage[]>([])
  const [input, setInput, inputRef] = useStateWithRef('')
  const [isGenerating, setIsGenerating, isGeneratingRef] = useStateWithRef(false)
  const [canContinue, setCanContinue] = useState(false)
  const [isPreparingModel, setIsPreparingModel] = useState(false)
  const summaryRef = useRef<string | null>(null)
  const clientSessionIdRef = useRef<string>(crypto.randomUUID())
  const lastAssistantIdRef = useRef<string | null>(null)
  const isSummarizingRef = useRef(false)
  const pendingSummarizeRef = useRef(false)
  const scheduledSummarizeIdRef = useRef<number | null>(null)
  const scheduleSummarizeRef = useRef<() => void>(() => {})
  const lastUserActivityAtRef = useRef<number>(Date.now())
  const tokenBudgetRef = useRef<TokenBudget | null>(null)

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
    const budget = tokenBudgetRef.current
    if (!budget) {
      scheduleSummarizeRef.current()
      return
    }

    const totalTokens = countHistoryTokens(currentMessages)
    if (totalTokens <= budget.historyMaxTokens) {
      pendingSummarizeRef.current = false
      return
    }

    const engine = engineRef.current
    if (!engine) {
      scheduleSummarizeRef.current()
      return
    }

    const pruneCount = pickPruneCountByTokenBudget({
      messages: currentMessages,
      minMessagesToKeep: MIN_MESSAGES_TO_KEEP_AFTER_SUMMARY,
      targetTokensAfterSummary: budget.historyTargetTokensAfterSummary,
    })
    const chunk = pruneCount > 0 ? currentMessages.slice(0, pruneCount) : []
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
        max_tokens: SUMMARY_MAX_TOKENS,
        ...(modelSupportsThinking && { extra_body: { enable_thinking: false } }),
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
    setCanContinue(false)
    setInput(next)
  }

  function stop() {
    markUserActivity()
    lastAssistantIdRef.current = null
    setCanContinue(false)
    setIsPreparingModel(false)
    interruptGenerate()
  }

  function newChat() {
    markUserActivity()
    cancelScheduledSummarize()
    pendingSummarizeRef.current = false
    isSummarizingRef.current = false
    lastAssistantIdRef.current = null
    setCanContinue(false)
    setIsPreparingModel(false)

    setMessages([])
    summaryRef.current = null
    clientSessionIdRef.current = crypto.randomUUID()
    resetChat()
  }

  function continueReply() {
    if (!canContinue) return
    void send('계속')
  }

  async function send(overrideText?: string) {
    if (isGeneratingRef.current) return

    markUserActivity()
    cancelScheduledSummarize()

    const rawText = typeof overrideText === 'string' ? overrideText : inputRef.current
    const text = rawText.trim()
    if (!text) return
    if (typeof overrideText !== 'string') {
      setInput('')
    }
    setCanContinue(false)

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
      if (!engineRef.current) {
        setIsPreparingModel(true)
      }
      const engine = await ensureEngine()
      setIsPreparingModel(false)

      const llmParams = {
        ...DEFAULT_LLM_PARAMS[modelMode],
        ...character.llmParams?.[modelMode],
      }

      const budget = getTokenBudget({
        contextWindowSize: modelContextWindowSize,
        completionMaxTokens: typeof llmParams.max_tokens === 'number' ? llmParams.max_tokens : CHAT_REPLY_MAX_TOKENS,
      })
      tokenBudgetRef.current = budget

      const context = buildContext({
        systemPrompt: character.systemPrompt,
        messages: [...prevMessages, userMessage],
        summary: summaryRef.current,
        historyMaxTokens: budget.historyMaxTokens,
      })

      const stream = await engine.chat.completions.create({
        messages: context,
        stream: true,
        stream_options: { include_usage: true },
        ...llmParams,
        ...(modelSupportsThinking && { extra_body: { enable_thinking: modelMode === 'thinking' } }),
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
          if (trimmed && modelMode === 'thinking') {
            thinkParts.push(trimmed)
          }
          thinkBuffer = ''

          text = text.slice(closeIndex + closeTag.length)
          insideThink = false
        }
      }

      let finishReason: string | null = null
      let finalUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null = null
      for await (const chunk of stream) {
        if (chunk.usage && typeof chunk.usage.prompt_tokens === 'number') {
          finalUsage = chunk.usage
        }
        const nextFinishReason = chunk.choices[0]?.finish_reason
        if (typeof nextFinishReason === 'string' && nextFinishReason.length > 0) {
          finishReason = nextFinishReason
        }
        const delta = chunk.choices[0]?.delta?.content ?? ''
        if (!delta) continue
        if (lastAssistantIdRef.current !== assistantId) break

        if (modelSupportsThinking) {
          consumeThinkingDelta(delta)
        } else {
          visible += delta
        }

        scheduleAssistantVisibleUpdate(visible)
      }

      // Flush any trailing buffered text (used for `<think>` tag boundary detection).
      // Without this, answers can lose the last few characters when the model doesn't emit `<think>` tags.
      if (modelSupportsThinking && buffer.length > 0) {
        if (insideThink) {
          thinkBuffer += buffer
        } else if (visible.length === 0) {
          visible += buffer.trimStart()
        } else {
          visible += buffer
        }
        buffer = ''
        scheduleAssistantVisibleUpdate(visible)
      }

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }

      // Ensure the final visible text is committed even if the last rAF update was cancelled.
      if (lastAssistantIdRef.current === assistantId && visible.length > 0) {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.id === assistantId) {
            const next = prev.slice()
            next[next.length - 1] = { ...last, content: visible }
            return next
          }
          const idx = prev.findIndex((m) => m.id === assistantId)
          if (idx === -1) return prev
          const next = prev.slice()
          next[idx] = { ...next[idx], content: visible }
          return next
        })
      }

      if (modelMode === 'thinking' && thinkBuffer.trim()) {
        thinkParts.push(thinkBuffer.trim())
      }

      const assistantContent = visible
      const assistantThink = thinkParts.filter(Boolean).join('\n\n')
      const hasAssistantContent = assistantContent.trim().length > 0

      const userTokenCount = finalUsage?.prompt_tokens
      const assistantTokenCount = finalUsage?.completion_tokens

      const userMessageWithTokens =
        typeof userTokenCount === 'number' && Number.isFinite(userTokenCount) && userTokenCount > 0
          ? { ...userMessage, tokenCount: userTokenCount }
          : userMessage

      const assistantMessageWithTokens =
        typeof assistantTokenCount === 'number' && Number.isFinite(assistantTokenCount) && assistantTokenCount > 0
          ? { ...assistantMessage, content: assistantContent, tokenCount: assistantTokenCount }
          : { ...assistantMessage, content: assistantContent }

      const finalMessages = hasAssistantContent
        ? [...prevMessages, userMessageWithTokens, assistantMessageWithTokens]
        : [...prevMessages, userMessageWithTokens]

      const sessionId = clientSessionIdRef.current
      await enqueueCreateSession({
        clientSessionId: sessionId,
        characterKey: character.key,
        characterName: character.name,
        systemPrompt: character.systemPrompt,
        modelId,
      })

      setMessages((prev) => {
        const filtered = hasAssistantContent ? prev : prev.filter((m) => m.id !== assistantId)

        return filtered.map((m) => {
          if (
            typeof userTokenCount === 'number' &&
            Number.isFinite(userTokenCount) &&
            userTokenCount > 0 &&
            m.id === userMessage.id
          ) {
            return { ...m, tokenCount: userTokenCount }
          }

          if (hasAssistantContent && m.id === assistantId) {
            const next: ChatMessage = { ...m }
            if (
              typeof assistantTokenCount === 'number' &&
              Number.isFinite(assistantTokenCount) &&
              assistantTokenCount > 0
            ) {
              next.tokenCount = assistantTokenCount
            }
            if (assistantThink) {
              next.debug = { ...next.debug, think: assistantThink }
            }
            return next
          }

          return m
        })
      })

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

      if (hasAssistantContent && countHistoryTokens(finalMessages) > budget.historyMaxTokens) {
        pendingSummarizeRef.current = true
        scheduleSummarize()
      }

      if (finishReason === 'length' && hasAssistantContent) {
        setCanContinue(true)
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[chat] failed to generate response', error)
      }
      toast.error('응답을 생성하지 못했어요')
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsGenerating(false)
      setIsPreparingModel(false)
    }
  }

  return {
    canContinue,
    continueReply,
    currentAssistantId: lastAssistantIdRef.current,
    input,
    isGenerating,
    isPreparingModel,
    isLocked,
    messages,
    newChat,
    onInputChange,
    send,
    stop,
  }
}
