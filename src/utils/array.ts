export function uniqBy<T extends Record<string, unknown>>(arr: T[], key: string | ((x: T) => unknown)) {
  const seen = new Set()
  const getKey = typeof key === 'function' ? key : (x: T) => x?.[key]
  return arr.filter((item) => {
    const k = getKey(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
