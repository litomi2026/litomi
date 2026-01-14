import type { ChatMessage } from '../types/chatMessage'

export type PickPruneCountByTokenBudgetOptions = {
  messages: ChatMessage[]
  targetTokensAfterSummary: number
  minMessagesToKeep: number
}

export function countHistoryTokens(messages: ChatMessage[]): number {
  let total = 0
  for (const m of messages) {
    total += estimateMessageTokens(m)
  }
  return total
}

export function estimateMessageTokens(message: ChatMessage): number {
  const raw = message.tokenCount
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw)
  }

  // Conservative fallback: 1 token per character (good enough until we get real usage stats).
  const trimmed = message.content.trim()
  return Math.max(1, trimmed.length)
}

export function pickPruneCountByTokenBudget({
  messages,
  targetTokensAfterSummary,
  minMessagesToKeep,
}: PickPruneCountByTokenBudgetOptions): number {
  if (messages.length === 0) return 0

  const totalTokens = countHistoryTokens(messages)
  if (totalTokens <= targetTokensAfterSummary) return 0

  const keepAtLeast = Math.max(0, Math.floor(minMessagesToKeep))
  const maxPrune = Math.max(0, messages.length - keepAtLeast)
  if (maxPrune === 0) return 0

  let remaining = totalTokens
  let pruneCount = 0
  while (pruneCount < maxPrune && remaining > targetTokensAfterSummary) {
    remaining -= estimateMessageTokens(messages[pruneCount])
    pruneCount += 1
  }
  return pruneCount
}

export function pickRecentMessagesByTokenBudget(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
  if (messages.length === 0) return []

  const result: ChatMessage[] = []
  let budget = Math.max(0, Math.floor(maxTokens))

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    const tokens = estimateMessageTokens(m)
    if (result.length === 0) {
      // Always keep the last message (should be the user's input).
      result.push(m)
      budget -= tokens
      continue
    }
    if (budget - tokens < 0) {
      break
    }
    result.push(m)
    budget -= tokens
  }

  return result.reverse()
}
