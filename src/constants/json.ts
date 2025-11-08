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
    images: [{ original: { url: FALLBACK_IMAGE_URL } }],
  }
}

export const DEFAULT_SUGGESTIONS = [
  { value: 'language:', label: '언어' },
  { value: 'artist:', label: '작가' },
  { value: 'group:', label: '그룹' },
  { value: 'series:', label: '시리즈' },
  { value: 'character:', label: '캐릭터' },
  { value: 'uploader:', label: '업로더' },
  { value: 'female:', label: '여' },
  { value: 'male:', label: '남' },
  { value: 'mixed:', label: '혼합' },
  { value: 'other:', label: '기타' },
]
