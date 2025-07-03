export function getSearchLink(filterType: string, value: string) {
  const query = `${filterType}:${value}`
  return `/search?query=${encodeURIComponent(query)}`
}
