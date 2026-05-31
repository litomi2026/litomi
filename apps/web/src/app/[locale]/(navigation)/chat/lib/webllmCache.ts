'use client'

import type { AppConfig } from '@mlc-ai/web-llm'

import { deleteModelAllInfoInCache, hasModelInCache } from '@mlc-ai/web-llm'

import type { ModelId } from './webllmModel'

export async function deleteInstalledModel(modelId: ModelId, appConfig: AppConfig): Promise<void> {
  await deleteModelAllInfoInCache(modelId, appConfig)
}

export async function hasInstalledModel(modelId: ModelId, appConfig: AppConfig): Promise<boolean> {
  return await hasModelInCache(modelId, appConfig)
}
