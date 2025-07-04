export function getKoreanSearchLink(filterType: string, value: string) {
  const query = `language:korean ${filterType}:${value.replaceAll(' ', '_')}`
  return `/search?query=${encodeURIComponent(query)}`
}
