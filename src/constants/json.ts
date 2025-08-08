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

export const ERROR_MANGA = {
  id: 0,
  title: '오류가 발생했어요',
  images: [FALLBACK_IMAGE_URL],
  cdn: '',
}
