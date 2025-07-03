export function getSearchLink(filterType: string, value: string) {
  const query = `${filterType}:${value.replaceAll(' ', '_')}`
  return `/search?query=${encodeURIComponent(query)}`
}
