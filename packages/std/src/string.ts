export function normalizeString(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? ''

  return normalized.length > 0 ? normalized : null
}

export function truncateAtWordBoundary(text: string | undefined, maxLength: number): string {
  if (!text) {
    return ''
  }

  if (text.length <= maxLength) {
    return text
  }

  const sliced = text.slice(0, maxLength)

  // 경계 바로 다음 글자가 공백이면 슬라이스가 이미 온전한 단어에서 끝난다.
  if (/\s/.test(text[maxLength] ?? '')) {
    return sliced.trimEnd()
  }

  // 아니면 단어가 쪼개진 것이므로 마지막 미완성 단어를 제거한다.
  const withoutPartialWord = sliced.replace(/\s+\S*$/, '')

  return (withoutPartialWord || sliced).trimEnd()
}
