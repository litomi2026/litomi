'use client'

import { Bot, Cpu, Download, LockKeyhole, MessageCircle, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import LoginButton from '@/components/LoginButton'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'

import type { InitProgressReport } from './_lib/webllm'

import Onboarding from '../(right-search)/[name]/settings/Onboarding'
import { CHARACTERS } from './_lib/characters'
import { enqueueAppendMessages, enqueueCreateSession, useOutboxAutoFlush } from './_lib/outbox'
import { useSingleTabLock } from './_lib/useSingleTabLock'
import {
  createWebLLMEngine,
  DEFAULT_MODEL_PRESET_KEY,
  deleteInstalledModel,
  hasInstalledModel,
  MODEL_PRESETS,
  type ModelPresetKey,
  type WebLLMEngine,
} from './_lib/webllm'

const { NEXT_PUBLIC_BACKEND_URL } = env

const MODEL_PRESET_STORAGE_KEY = 'litomi:character-chat:model-preset'

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

const MAX_TURNS_FOR_CONTEXT = 30
const DEFAULT_MAX_TOKENS = 512
const MIN_IOS_SAFARI_TEXT = 'iOS 18 / Safari 18 이상'

export default function CharacterChatPageClient() {
  const { data: me, isLoading } = useMeQuery()
  const userId = me?.id

  const [characterKey, setCharacterKey] = useState(CHARACTERS[0]?.key ?? '')
  const character = useMemo(() => CHARACTERS.find((c) => c.key === characterKey) ?? CHARACTERS[0], [characterKey])

  const [modelPresetKey, setModelPresetKey] = useState<ModelPresetKey>(() => {
    if (typeof window === 'undefined') return DEFAULT_MODEL_PRESET_KEY
    const saved = window.localStorage.getItem(MODEL_PRESET_STORAGE_KEY)
    const found = MODEL_PRESETS.find((p) => p.key === saved)
    return found?.key ?? DEFAULT_MODEL_PRESET_KEY
  })
  const modelPreset = useMemo(
    () => MODEL_PRESETS.find((p) => p.key === modelPresetKey) ?? MODEL_PRESETS[0],
    [modelPresetKey],
  )
  const modelId = modelPreset.modelId

  const [engine, setEngine] = useState<WebLLMEngine | null>(null)
  const [installState, setInstallState] = useState<
    | { kind: 'error'; message: string }
    | { kind: 'installed' }
    | { kind: 'installing'; progress: InitProgressReport }
    | { kind: 'not-installed' }
    | { kind: 'unknown' }
  >({ kind: 'unknown' })

  const [isWebGpuReady, setIsWebGpuReady] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const summarizedUntilRef = useRef(0)
  const isSummarizingRef = useRef(false)
  const [clientSessionId, setClientSessionId] = useState(() => crypto.randomUUID())

  const lastAssistantIdRef = useRef<string | null>(null)
  const messagesRef = useRef<ChatMessage[]>(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const tabLock = useSingleTabLock({
    channel: 'litomi:character-chat',
    title: 'AI 채팅',
  })

  const outbox = useOutboxAutoFlush({
    enabled: Boolean(userId),
    backendUrl: NEXT_PUBLIC_BACKEND_URL,
    onUnauthorized: () => {
      toast.warning('로그인 정보가 만료됐어요')
    },
  })

  const refreshInstallState = useCallback(async () => {
    const installed = await hasInstalledModel(modelId).catch(() => null)
    if (installed === null) {
      setInstallState({ kind: 'error', message: '모델 상태를 확인하지 못했어요' })
      return
    }
    setInstallState(installed ? { kind: 'installed' } : { kind: 'not-installed' })
  }, [modelId])

  useEffect(() => {
    if (!userId || tabLock.kind !== 'acquired') {
      return
    }

    const controller = new AbortController()

    async function init() {
      const supported = await isWebGpuSupported()
      if (controller.signal.aborted) return
      setIsWebGpuReady(supported)
    }

    init().catch(() => {})

    return () => controller.abort()
  }, [userId, tabLock.kind])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(MODEL_PRESET_STORAGE_KEY, modelPresetKey)
  }, [modelPresetKey])

  useEffect(() => {
    if (!userId || tabLock.kind !== 'acquired') return
    if (isWebGpuReady !== true) return
    setInstallState({ kind: 'unknown' })
    refreshInstallState()
  }, [userId, tabLock.kind, isWebGpuReady, refreshInstallState])

  const install = useCallback(async () => {
    setInstallState({ kind: 'installing', progress: { progress: 0, timeElapsed: 0, text: '모델을 준비하고 있어요' } })

    try {
      const engine = await createWebLLMEngine({
        modelId,
        onProgress: (report) => setInstallState({ kind: 'installing', progress: report }),
      })
      setEngine(engine)
      setInstallState({ kind: 'installed' })
    } catch (error) {
      setInstallState({
        kind: 'error',
        message: error instanceof Error ? error.message : '모델을 설치하지 못했어요',
      })
    }
  }, [modelId])

  const ensureEngine = useCallback(async () => {
    if (engine) {
      await engine.reload(modelId)
      return engine
    }

    const nextEngine = await createWebLLMEngine({
      modelId,
      onProgress: (report) => setInstallState({ kind: 'installing', progress: report }),
    })
    setEngine(nextEngine)
    return nextEngine
  }, [engine, modelId])

  const removeInstalledModel = useCallback(async () => {
    await deleteInstalledModel(modelId)
    await engine?.unload().catch(() => {})
    toast.success('모델을 삭제했어요')
    setEngine(null)
    await refreshInstallState()
  }, [modelId, engine, refreshInstallState])

  const send = useCallback(async () => {
    if (!character || !input.trim() || isGenerating) {
      return
    }

    const text = input.trim()
    setInput('')

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
        messages: [...messagesRef.current, userMessage],
        maxTurns: MAX_TURNS_FOR_CONTEXT,
        summary,
      })

      const stream = await engine.chat.completions.create({
        messages: context,
        stream: true,
        temperature: 0.4,
        top_p: 0.9,
        max_tokens: DEFAULT_MAX_TOKENS,
      })

      let acc = ''
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        if (!delta) {
          continue
        }
        acc += delta

        const currentAssistantId = lastAssistantIdRef.current
        if (currentAssistantId !== assistantId) {
          break
        }

        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)))
      }

      const finalMessages = [...messagesRef.current, userMessage, { ...assistantMessage, content: acc }]

      await enqueueCreateSession({
        clientSessionId,
        characterKey: character.key,
        characterName: character.name,
        systemPrompt: character.systemPrompt,
        modelId,
      })

      await enqueueAppendMessages({
        clientSessionId,
        messages: [
          { clientMessageId: userMessage.id, role: 'user', content: userMessage.content },
          { clientMessageId: assistantId, role: 'assistant', content: acc },
        ],
      })

      outbox.flush()

      void maybeUpdateSummary({
        engine,
        allMessages: finalMessages,
        currentSummary: summary,
        summarizedUntilRef,
        isSummarizingRef,
        onUpdate: (next) => setSummary(next),
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '응답을 생성하지 못했어요')
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsGenerating(false)
    }
  }, [character, input, isGenerating, ensureEngine, summary, clientSessionId, outbox, modelId])

  const stop = useCallback(() => {
    lastAssistantIdRef.current = null
    engine?.interruptGenerate()
  }, [engine])

  if (isLoading) {
    return <div className="p-6 text-sm text-zinc-400">로딩 중이에요…</div>
  }

  if (!userId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Onboarding
          benefits={[
            {
              icon: <Cpu className="size-5" />,
              title: '내 기기에서 실행',
              description: '서버 비용 없이 내 GPU로 추론해요',
            },
            { icon: <Download className="size-5" />, title: '모델 설치', description: '처음 한 번만 내려받으면 돼요' },
            {
              icon: <MessageCircle className="size-5" />,
              title: '로그 저장',
              description: '대화 기록이 계정에 저장돼요',
            },
          ]}
          description="로그인하고 내 기기에서 캐릭터 AI 채팅을 시작해요"
          icon={<LockKeyhole className="size-12 text-brand" />}
          title="AI 채팅은 로그인이 필요해요"
        >
          <LoginButton>로그인하기</LoginButton>
        </Onboarding>
      </div>
    )
  }

  if (tabLock.kind === 'blocked') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Onboarding
          benefits={[
            {
              icon: <Smartphone className="size-5" />,
              title: '메모리 절약',
              description: '여러 탭 동시 실행을 막아서 안정적으로 동작해요',
            },
            {
              icon: <Cpu className="size-5" />,
              title: 'GPU 공유',
              description: '모델이 탭마다 중복 로드되는 걸 피할 수 있어요',
            },
          ]}
          description="다른 탭에서 AI 채팅을 사용 중이에요. 그 탭을 닫고 다시 시도해 주세요"
          icon={<Bot className="size-12 text-brand" />}
          title="AI 채팅은 한 탭에서만 실행돼요"
        >
          <button
            className="inline-flex items-center justify-center gap-2 w-full max-w-3xs p-3 rounded-xl border border-zinc-700/60 hover:border-zinc-500 transition"
            onClick={tabLock.retry}
            type="button"
          >
            다시 시도
          </button>
        </Onboarding>
      </div>
    )
  }

  if (isWebGpuReady === false) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Onboarding
          benefits={[
            {
              icon: <Cpu className="size-5" />,
              title: 'WebGPU 필요',
              description: '현재는 GPU가 있어야 실행할 수 있어요',
            },
            {
              icon: <Smartphone className="size-5" />,
              title: 'iOS Safari',
              description: '설정에서 WebGPU를 켜야 할 수 있어요',
            },
          ]}
          description={`이 기기에서는 WebGPU를 사용할 수 없어요. (지원: ${MIN_IOS_SAFARI_TEXT}) iOS Safari라면 설정 > Safari > 고급 > 실험적 기능에서 WebGPU를 켜고 다시 시도해 주세요`}
          icon={<Cpu className="size-12 text-brand" />}
          title="이 기기에서는 AI 채팅을 지원하지 않아요"
        >
          <button
            className="inline-flex items-center justify-center gap-2 w-full max-w-3xs p-3 rounded-xl border border-zinc-700/60 hover:border-zinc-500 transition"
            onClick={() => window.location.reload()}
            type="button"
          >
            다시 확인
          </button>
        </Onboarding>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-3xl w-full">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">캐릭터 AI 채팅</h1>
          <p className="text-sm text-zinc-400">모델은 내 기기에서 실행되고, 대화 기록은 계정에 저장돼요</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="text-xs text-zinc-400 underline hover:text-zinc-200 transition"
            onClick={() => {
              setMessages([])
              setSummary(null)
              summarizedUntilRef.current = 0
              isSummarizingRef.current = false
              setClientSessionId(crypto.randomUUID())
              engine?.resetChat()
            }}
            type="button"
          >
            새 채팅
          </button>
          <a
            className="text-xs text-zinc-400 underline hover:text-zinc-200 transition"
            href={`${NEXT_PUBLIC_BACKEND_URL}/api/v1/me`}
            rel="noreferrer"
            target="_blank"
          >
            상태 확인
          </a>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-800/60 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">모델</p>
          {installState.kind === 'installed' ? (
            <button
              className="text-sm text-zinc-300 underline hover:text-zinc-100 transition"
              onClick={removeInstalledModel}
              type="button"
            >
              삭제
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="model-preset">
            모델 프리셋
          </label>
          <select
            aria-disabled={messages.length > 0 || installState.kind === 'installing'}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
            disabled={messages.length > 0 || installState.kind === 'installing'}
            id="model-preset"
            name="model-preset"
            onChange={(e) => setModelPresetKey(e.target.value as ModelPresetKey)}
            value={modelPresetKey}
          >
            {MODEL_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">{modelPreset.description}</p>
          <p className="text-xs text-zinc-500">표기한 용량은 대략 필요한 GPU 메모리(VRAM)예요</p>
          {messages.length > 0 ? (
            <p className="text-xs text-zinc-500">대화가 시작된 뒤에는 모델을 바꿀 수 없어요</p>
          ) : null}
        </div>

        {installState.kind === 'unknown' ? (
          <p className="text-sm text-zinc-500">모델 상태를 확인하고 있어요…</p>
        ) : installState.kind === 'not-installed' ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">처음 한 번만 내려받으면 돼요</p>
            <button
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white transition"
              onClick={install}
              type="button"
            >
              <Download className="size-4" />
              설치하기
            </button>
          </div>
        ) : installState.kind === 'installing' ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-400">{installState.progress.text}</p>
            <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
              <div
                className="h-2 bg-brand transition-[width] duration-200"
                style={{ width: `${installState.progress.progress * 100}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">
              {(installState.progress.progress * 100).toFixed(1)}% · {Math.round(installState.progress.timeElapsed)}초
            </p>
          </div>
        ) : installState.kind === 'error' ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-red-300">{installState.message}</p>
            <button
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-700/60 hover:border-zinc-500 transition"
              onClick={refreshInstallState}
              type="button"
            >
              다시 확인
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">설치됐어요</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800/60 p-4 flex flex-col gap-3">
        <label className="text-sm font-medium" htmlFor="character">
          캐릭터
        </label>
        <select
          aria-disabled={messages.length > 0}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
          disabled={messages.length > 0}
          id="character"
          name="character"
          onChange={(e) => setCharacterKey(e.target.value)}
          value={characterKey}
        >
          {CHARACTERS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">{character?.description}</p>
      </section>

      <section className="rounded-2xl border border-zinc-800/60 p-4 flex flex-col gap-3 min-h-[40vh]">
        <div className="flex flex-col gap-2">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-500">메시지를 보내면 대화를 시작할 수 있어요</p>
          ) : (
            messages.map((m) => (
              <div
                className="rounded-2xl px-3 py-2 border border-zinc-800/60 bg-zinc-950/60"
                data-role={m.role}
                key={m.id}
              >
                <p className="text-xs text-zinc-500 mb-1">{m.role === 'user' ? '나' : (character?.name ?? 'AI')}</p>
                <p className="text-sm whitespace-pre-wrap wrap-break-word">{m.content}</p>
              </div>
            ))
          )}
        </div>

        <form
          className="mt-auto flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <textarea
            className="min-h-24 rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
            id="message"
            name="message"
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력해 주세요"
            required
            value={input}
          />
          <div className="flex items-center justify-between gap-2">
            <button
              aria-disabled={!isGenerating}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-700/60 hover:border-zinc-500 transition"
              onClick={stop}
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
    </div>
  )
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

async function isWebGpuSupported(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false
  if (!('gpu' in navigator)) return false
  try {
    const gpu = (navigator as { gpu?: unknown }).gpu
    if (!gpu || typeof gpu !== 'object') return false
    if (!('requestAdapter' in gpu)) return false
    const requestAdapter = (gpu as { requestAdapter?: unknown }).requestAdapter
    if (typeof requestAdapter !== 'function') return false

    const adapter = await (gpu as { requestAdapter: () => Promise<unknown> }).requestAdapter()
    return Boolean(adapter)
  } catch {
    return false
  }
}

async function maybeUpdateSummary(options: {
  engine: WebLLMEngine
  allMessages: ChatMessage[]
  currentSummary: string | null
  summarizedUntilRef: { current: number }
  isSummarizingRef: { current: boolean }
  onUpdate: (summary: string) => void
}) {
  const { engine, allMessages, currentSummary, summarizedUntilRef, isSummarizingRef, onUpdate } = options

  if (isSummarizingRef.current) {
    return
  }

  const tailMessagesCount = MAX_TURNS_FOR_CONTEXT * 2
  const boundary = Math.max(0, allMessages.length - tailMessagesCount)
  const summarizedUntil = summarizedUntilRef.current

  if (boundary <= summarizedUntil) {
    return
  }

  const chunk = allMessages.slice(summarizedUntil, boundary)
  if (chunk.length === 0) {
    return
  }

  isSummarizingRef.current = true

  try {
    const prompt = buildSummaryPrompt({ currentSummary, newMessages: chunk })

    const res = await engine.chat.completions.create({
      messages: prompt,
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: DEFAULT_MAX_TOKENS,
    })

    const text = res.choices[0]?.message?.content?.trim()
    if (!text) {
      return
    }

    summarizedUntilRef.current = boundary
    onUpdate(text)
  } catch {
    // NOTE: 요약 실패는 치명적이지 않아서 무시해요
  } finally {
    isSummarizingRef.current = false
  }
}
