import type { ChatMessage } from '../types/chatMessage'

import { pickRecentMessagesByTokenBudget } from './chatTokens'

export type BuildContextOptions = {
  systemPrompt: string
  messages: ChatMessage[]
  summary: string | null
  historyMaxTokens: number
}

export type BuildSummaryPromptOptions = {
  currentSummary: string | null
  newMessages: ChatMessage[]
}

export type LLMChatMessage = { role: 'assistant' | 'system' | 'user'; content: string }

export function buildContext({
  systemPrompt,
  messages,
  summary,
  historyMaxTokens,
}: BuildContextOptions): LLMChatMessage[] {
  const recent = pickRecentMessagesByTokenBudget(messages, historyMaxTokens)
  const system = summary
    ? `${systemPrompt}\n\n[이전 대화 요약]\n${summary}\n\n(요약을 참고해서 대화를 이어가 주세요.)`
    : systemPrompt

  return [{ role: 'system', content: system }, ...recent.map((m) => ({ role: m.role, content: m.content }))]
}

export function buildSummaryPrompt({ currentSummary, newMessages }: BuildSummaryPromptOptions): LLMChatMessage[] {
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
    '- 인물/호칭/관계',
    '- 사용자의 목표/선호/금기',
    '- 진행 중인 계획/약속/해야 할 일',
    '형식은 8~12줄 이내의 불릿 리스트로 해.',
  ].join('\n')

  const user = currentSummary
    ? `현재 메모리가 있어요:\n${currentSummary}\n\n아래 대화를 반영해서 메모리를 업데이트해 주세요:\n${transcript}`
    : `아래 대화를 메모리로 요약해 주세요:\n${transcript}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
