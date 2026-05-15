export function parseMangaIds(text: string): number[] {
  const matches = text.match(/\b\d+\b/g)

  if (!matches) {
    return []
  }

  const seen = new Set<number>()
  const mangaIds: number[] = []

  for (const match of matches) {
    const mangaId = Number(match)

    if (!Number.isSafeInteger(mangaId) || seen.has(mangaId)) {
      continue
    }

    seen.add(mangaId)
    mangaIds.push(mangaId)
  }

  return mangaIds
}
