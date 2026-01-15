import type { CharacterDefinition, LlmParams } from '../types/characterDefinition'

import commonJSON from './common.json'

export type CharacterJsonDefinition = {
  id: string
  name: string
  description: string
  systemPromptBlocks: string[][]
  llmParams?: {
    chat?: LlmParams
    thinking?: LlmParams
  }
}

export function buildCharacter(json: CharacterJsonDefinition): CharacterDefinition {
  const systemPrompt = [
    joinBlocks(commonJSON.commonSystemPromptBlocks),
    joinBlocks(json.systemPromptBlocks),
    joinBlocks(commonJSON.commonSystemPromptAtEndBlocks),
  ]
    .filter((s) => s.trim().length > 0)
    .join('\n\n')

  return {
    id: json.id,
    name: json.name,
    description: json.description,
    systemPrompt,
    llmParams: json.llmParams,
  }
}

/**
 * Blocks of prompt lines. Each inner array is joined with '\n'.
 * Blocks are then joined with '\n\n' (one empty line between blocks).
 */
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
