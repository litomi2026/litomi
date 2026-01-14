export type GetTokenBudgetOptions = {
  contextWindowSize?: number
  completionMaxTokens: number
}

export type TokenBudget = {
  completionMaxTokens: number
  contextWindowSize: number
  hardMaxPromptTokens: number
  historyMaxTokens: number
  historyTargetTokensAfterSummary: number
}

// Token budgeting
//
// - Keep a completion buffer (1~2k tokens) so we don't bump into the context limit
// - Keep prompt small for fast answers; "memory" comes from summary
const COMPLETION_TOKEN_BUFFER = 1536
const SYSTEM_PROMPT_TOKEN_BUDGET = 1024
const DEFAULT_HISTORY_MAX_TOKENS = 30000
const DEFAULT_HISTORY_TARGET_TOKENS_AFTER_SUMMARY = 20000

export function getTokenBudget({ contextWindowSize, completionMaxTokens }: GetTokenBudgetOptions): TokenBudget {
  const safeContextWindowSize = clampInt(contextWindowSize, 4096)
  const safeCompletionMaxTokens = clampInt(completionMaxTokens, 512)

  const hardMaxPromptTokens = Math.max(512, safeContextWindowSize - (safeCompletionMaxTokens + COMPLETION_TOKEN_BUFFER))
  const historyMaxTokens = Math.max(
    512,
    Math.min(DEFAULT_HISTORY_MAX_TOKENS, hardMaxPromptTokens - SYSTEM_PROMPT_TOKEN_BUDGET),
  )
  const historyTargetTokensAfterSummary = Math.max(
    256,
    Math.min(DEFAULT_HISTORY_TARGET_TOKENS_AFTER_SUMMARY, historyMaxTokens - 512),
  )

  return {
    completionMaxTokens: safeCompletionMaxTokens,
    contextWindowSize: safeContextWindowSize,
    hardMaxPromptTokens,
    historyMaxTokens,
    historyTargetTokensAfterSummary,
  }
}

function clampInt(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback
  return Math.floor(value)
}
