import { Manga } from '@/types/manga'

/**
 * Example: "series:naruto" -> "parody:naruto"
 *
 * Example: "id:12345" -> "gid:12345"
 */
export function convertQueryKey(query?: string) {
  return query?.replace(/\bid:/gi, 'gid:').replace(/\bseries:/gi, 'parody:')
}

export function filterMangasByExcludedFilters(
  mangas: Manga[],
  excludedTags: Array<{ category: string; value: string }>,
): Manga[] {
  if (excludedTags.length === 0) {
    return mangas
  }

  return mangas.filter((manga) => {
    // Check if manga has any of the excluded tags
    const hasExcludedTag = excludedTags.some((excludedTag) => {
      return manga.tags?.some((tag) => {
        const normalizedTagValue = tag.value.toLowerCase().replace(/_/g, ' ')
        const normalizedTagCategory = tag.category.toLowerCase()

        // Match both category and value, or just value if category is empty
        if (excludedTag.category && excludedTag.category !== '') {
          return normalizedTagCategory === excludedTag.category && normalizedTagValue === excludedTag.value
        }
        return normalizedTagValue === excludedTag.value
      })
    })

    // Keep manga if it doesn't have any excluded tags
    return !hasExcludedTag
  })
}

/**
 * Example:
 *
 * 1. "-other:ai_generated -female:big_breasts" ->
 *
 * [{ category: 'other', value: 'ai_generated' }, { category: 'female', value: 'big_breasts' }]
 *
 * 2. "-ai_generated" ->
 *
 * [{ category: '', value: 'ai_generated' }]
 */
export function parseExclusionFilters(query?: string): Array<{ category: string; value: string }> {
  if (!query) {
    return []
  }

  // Match both "-category:value" and "-value" patterns
  const excludePatternWithCategory = /-(\w+):(\S+)/g
  const excludePatternSimple = /-(?![\w]+:)(\S+)/g
  const filters: Array<{ category: string; value: string }> = []

  // First, extract filters with category
  let match
  while ((match = excludePatternWithCategory.exec(query)) !== null) {
    filters.push({
      category: match[1].toLowerCase(),
      value: match[2].toLowerCase().replace(/_/g, ' '),
    })
  }

  // Then, extract simple filters without category
  // Create a new query string without the already matched category filters
  const queryWithoutCategoryFilters = query.replace(excludePatternWithCategory, '')
  while ((match = excludePatternSimple.exec(queryWithoutCategoryFilters)) !== null) {
    filters.push({
      category: '',
      value: match[1].toLowerCase().replace(/_/g, ' '),
    })
  }

  return filters
}
