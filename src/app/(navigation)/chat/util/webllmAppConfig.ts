import type * as webllm from '@mlc-ai/web-llm'

export function getModelContextWindowSizeFromAppConfig(appConfig: webllm.AppConfig, modelId: string): number {
  const record = appConfig.model_list.find((m) => m.model_id === modelId)
  const raw = record?.overrides?.context_window_size
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw)
  }
  return 4096
}
