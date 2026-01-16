import type { CharacterDefinition, CharacterPromptDefinition, LlmParams } from '../types/characterDefinition'

import commonJSON from './common.json'

export type CharacterJsonDefinition = CharacterJsonDefinitionExpanded | CharacterJsonDefinitionLegacy

export type CharacterPromptJsonDefinition = {
  id: string
  title: string
  description?: string
  systemPromptBlocks: string[][]
  llmParams?: {
    chat?: LlmParams
    thinking?: LlmParams
  }
}

type CharacterJsonBase = {
  id: string
  name: string
  description: string
  llmParams?: {
    chat?: LlmParams
    thinking?: LlmParams
  }
}

type CharacterJsonDefinitionExpanded = CharacterJsonBase & {
  prompts: CharacterPromptJsonDefinition[]
  defaultPromptId?: string
}

type CharacterJsonDefinitionLegacy = CharacterJsonBase & {
  systemPromptBlocks: string[][]
}

export function buildCharacter(json: CharacterJsonDefinition): CharacterDefinition {
  const promptSource = hasPrompts(json)
    ? json.prompts
    : [
        {
          id: 'default',
          title: '기본 프롬프트',
          systemPromptBlocks: json.systemPromptBlocks,
        },
      ]

  const prompts = promptSource.map((prompt) => buildPrompt(prompt))

  const defaultPromptId = hasPrompts(json)
    ? (prompts.find((p) => p.id === json.defaultPromptId)?.id ?? prompts[0]?.id)
    : prompts[0]?.id

  return {
    id: json.id,
    name: json.name,
    description: json.description,
    prompts,
    defaultPromptId,
    llmParams: json.llmParams,
  }
}

function buildPrompt(prompt: CharacterPromptJsonDefinition): CharacterPromptDefinition {
  const systemPrompt = [
    joinBlocks(commonJSON.commonSystemPromptBlocks),
    joinBlocks(prompt.systemPromptBlocks),
    joinBlocks(commonJSON.commonSystemPromptAtEndBlocks),
  ]
    .filter((s) => s.trim().length > 0)
    .join('\n\n')

  return {
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    systemPrompt,
    llmParams: prompt.llmParams,
  }
}

function hasPrompts(json: CharacterJsonDefinition): json is CharacterJsonDefinitionExpanded {
  return 'prompts' in json
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
