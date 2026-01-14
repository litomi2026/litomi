'use client'

import { deleteModelAllInfoInCache, hasModelInCache } from '@mlc-ai/web-llm'

import type { ModelId } from '../storage/webllmModels'

import { buildWebLLMAppConfig } from './webllmAppConfig'

export async function deleteInstalledModel(modelId: ModelId): Promise<void> {
  await deleteModelAllInfoInCache(modelId, buildWebLLMAppConfig())
}

export async function hasInstalledModel(modelId: ModelId): Promise<boolean> {
  return await hasModelInCache(modelId, buildWebLLMAppConfig())
}
