import type { CharacterDefinition, LlmParams } from '../types/characterDefinition'

import { commonSystemPrompt, commonSystemPromptAtEnd } from './common'

export type CharacterJsonDefinition = {
  key: string
  name: string
  description: string
  /**
   * Blocks of prompt lines. Each inner array is joined with '\n'.
   * Blocks are then joined with '\n\n' (one empty line between blocks).
   */
  systemPromptBlocks: string[][]
  llmParams?: {
    chat?: LlmParams
    thinking?: LlmParams
  }
}

export function buildCharacterDefinition(json: CharacterJsonDefinition): CharacterDefinition {
  const systemPrompt = [
    commonSystemPrompt.join('\n'),
    joinBlocks(json.systemPromptBlocks),
    commonSystemPromptAtEnd.join('\n'),
  ]
    .filter((s) => s.trim().length > 0)
    .join('\n\n')

  return {
    key: json.key,
    name: json.name,
    description: json.description,
    systemPrompt,
    llmParams: json.llmParams,
  }
}

function joinBlocks(blocks: string[][]): string {
  return blocks
    .map((lines) =>
      lines
        .map((line) => line.trimEnd())
        .join('\n')
        .trim(),
    )
    .filter((block) => block.length > 0)
    .join('\n\n')
}
