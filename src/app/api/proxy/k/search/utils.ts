import { normalizeValue } from '@/translation/common'
import { Manga } from '@/types/manga'

class NormalizedValueMap {
  private valueToNormalizedValueMap = new Map<string, string>()

  get(value: string): string {
    const cached = this.valueToNormalizedValueMap.get(value)
    if (cached !== undefined) {
      return cached
    }

    const normalized = normalizeValue(value)
    this.valueToNormalizedValueMap.set(value, normalized)
    return normalized
  }
}

export function convertToKHentaiKey(query?: string) {
  return query?.replace(/\bid:/gi, 'gid:').replace(/\bseries:/gi, 'parody:')
}

export function filterMangasByMinusPrefix(mangas: Manga[], query?: string) {
  if (!query) {
    return mangas
  }

  const filters = parseMinusPrefixFilters(query)

  if (filters.length === 0) {
    return mangas
  }

  const filterLookup = createFilterLookup(filters)

  if (isFilterLookupEmpty(filterLookup)) {
    return mangas
  }

  const normalizedValueMap = new NormalizedValueMap()

  return mangas.filter((manga) => {
    if (filterLookup.languages.size > 0 && manga.languages?.length) {
      for (const language of manga.languages) {
        if (filterLookup.languages.has(normalizedValueMap.get(language.value))) {
          return false
        }
      }
    }

    if (filterLookup.types.size > 0 && manga.type) {
      if (filterLookup.types.has(normalizedValueMap.get(manga.type.value))) {
        return false
      }
    }

    if (filterLookup.artists.size > 0 && manga.artists?.length) {
      for (const artist of manga.artists) {
        if (filterLookup.artists.has(normalizedValueMap.get(artist.value))) {
          return false
        }
      }
    }

    if (filterLookup.groups.size > 0 && manga.group?.length) {
      for (const group of manga.group) {
        if (filterLookup.groups.has(normalizedValueMap.get(group.value))) {
          return false
        }
      }
    }

    if (filterLookup.series.size > 0 && manga.series?.length) {
      for (const series of manga.series) {
        if (filterLookup.series.has(normalizedValueMap.get(series.value))) {
          return false
        }
      }
    }

    if (filterLookup.hasTags && manga.tags?.length) {
      for (const tag of manga.tags) {
        const category = tag.category
        const normalizedValue = normalizedValueMap.get(tag.value)

        if (!category) {
          continue
        }

        if (filterLookup.tags[category]?.has(normalizedValue)) {
          return false
        }
      }
    }

    return true
  })
}

const EXCLUDABLE_CATEGORIES = [
  'language',
  'type',
  'artist',
  'group',
  'series',
  'character',
  'female',
  'male',
  'mixed',
  'other',
] as const

type ExcludableCategory = (typeof EXCLUDABLE_CATEGORIES)[number]

export function parseMinusPrefixFilters(query: string) {
  const excludePatternWithCategory = /-(\w+):(\S+)/g
  const filters: { category: ExcludableCategory; value: string }[] = []

  let match
  while ((match = excludePatternWithCategory.exec(query)) !== null) {
    const category = normalizeValue(match[1]) as ExcludableCategory

    if (EXCLUDABLE_CATEGORIES.includes(category)) {
      filters.push({ category, value: normalizeValue(match[2]) })
    }
  }

  return filters
}

/**
 * Pre-process filters into efficient lookup structures
 * This reduces repeated string operations and enables O(1) lookups
 */
function createFilterLookup(filters: { category: ExcludableCategory; value: string }[]) {
  const lookup = {
    tags: {
      female: new Set<string>(),
      male: new Set<string>(),
      mixed: new Set<string>(),
      other: new Set<string>(),
    } as Record<string, Set<string>>,
    series: new Set<string>(),
    artists: new Set<string>(),
    groups: new Set<string>(),
    languages: new Set<string>(),
    types: new Set<string>(),
    hasTags: false,
  }

  for (const filter of filters) {
    const normalizedValue = normalizeValue(filter.value)
    const normalizedCategory = filter.category

    switch (normalizedCategory) {
      case 'artist':
        lookup.artists.add(normalizedValue)
        break
      case 'female':
      case 'male':
      case 'mixed':
      case 'other':
        lookup.tags[normalizedCategory].add(normalizedValue)
        lookup.hasTags = true
        break
      case 'group':
        lookup.groups.add(normalizedValue)
        break
      case 'language':
        lookup.languages.add(normalizedValue)
        break
      case 'series':
        lookup.series.add(normalizedValue)
        break
      case 'type':
        lookup.types.add(normalizedValue)
        break
    }
  }

  return lookup
}

function isFilterLookupEmpty(lookup: ReturnType<typeof createFilterLookup>): boolean {
  return (
    !lookup.hasTags &&
    lookup.series.size === 0 &&
    lookup.artists.size === 0 &&
    lookup.groups.size === 0 &&
    lookup.languages.size === 0 &&
    lookup.types.size === 0
  )
}
