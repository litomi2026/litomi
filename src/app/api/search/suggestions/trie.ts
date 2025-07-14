export type SuggestionItem = {
  value: string
  labels: {
    ko: string
    en: string
    ja?: string
    'zh-CN'?: string
    'zh-TW'?: string
  }
}

type TrieNode = {
  children: Map<string, TrieNode>
  suggestions: SuggestionItem[]
}

export default class SuggestionTrie {
  private root: TrieNode

  constructor() {
    this.root = {
      children: new Map(),
      suggestions: [],
    }
  }

  insert(prefix: string, suggestion: SuggestionItem) {
    let node = this.root
    const lowerPrefix = prefix.toLowerCase()

    for (const char of lowerPrefix) {
      if (!node.children.has(char)) {
        node.children.set(char, {
          children: new Map(),
          suggestions: [],
        })
      }
      node = node.children.get(char)!
      node.suggestions.push(suggestion)
    }
  }

  search(query: string, locale: string = 'ko', limit: number = 10): { label: string; value: string }[] {
    const lowerQuery = query.toLowerCase()
    let node = this.root

    // Traverse to the node representing the query prefix
    for (const char of lowerQuery) {
      if (!node.children.has(char)) {
        return []
      }
      node = node.children.get(char)!
    }

    // Deduplicate suggestions by value
    const seen = new Set<string>()
    const uniqueSuggestions: SuggestionItem[] = []
    let exactCategoryMatch: SuggestionItem | null = null

    for (const suggestion of node.suggestions) {
      // Handle exact matches
      if (suggestion.value.toLowerCase() === lowerQuery) {
        // If it's a category (ends with ":"), save it separately to put first
        if (suggestion.value.endsWith(':')) {
          exactCategoryMatch = suggestion
          continue
        } else {
          // Skip non-category exact matches
          continue
        }
      }

      if (!seen.has(suggestion.value)) {
        seen.add(suggestion.value)
        uniqueSuggestions.push(suggestion)
      }
    }

    // Sort with custom logic:
    // 1. Category-only values (ending with ":") come first
    // 2. Then sort by length (shorter first)
    // 3. Finally alphabetically
    uniqueSuggestions.sort((a, b) => {
      const aIsCategory = a.value.endsWith(':')
      const bIsCategory = b.value.endsWith(':')

      // Category values come first
      if (aIsCategory && !bIsCategory) return -1
      if (!aIsCategory && bIsCategory) return 1

      // Then by length
      const lengthDiff = a.value.length - b.value.length
      if (lengthDiff !== 0) return lengthDiff

      // Finally alphabetically
      return a.value.localeCompare(b.value)
    })

    // If we have an exact category match, put it first
    if (exactCategoryMatch) {
      uniqueSuggestions.unshift(exactCategoryMatch)
    }

    // Map to the response format with locale-specific labels
    return uniqueSuggestions
      .filter((item) => item.value !== query)
      .slice(0, limit)
      .map((item) => ({
        value: item.value,
        label: item.labels[locale as keyof typeof item.labels] || item.labels.en || item.value,
      }))
  }
}
