import { Manga } from '@/types/manga'

export const BLIND_TAG_VALUE_TO_LABEL: Record<string, string> = {
  bestiality: '수간',
  guro: '고어',
  yaoi: 'BL',
  males_only: 'BL',
  scat: '스캇',
  coprophagia: '스캇',
}

export const BLIND_TAG_VALUES = Object.keys(BLIND_TAG_VALUE_TO_LABEL)

export const FALLBACK_IMAGE_URL = '/image/fallback.svg'

export function createErrorManga({ error }: { error: unknown }): Manga {
  return {
    id: 0,
    title: error instanceof Error ? `${error.name}: ${error.message}\n${error.cause ?? ''}` : '오류가 발생했어요',
    images: [FALLBACK_IMAGE_URL],
  }
}
