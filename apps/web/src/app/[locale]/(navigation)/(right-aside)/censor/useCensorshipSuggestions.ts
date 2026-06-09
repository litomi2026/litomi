'use client'

import useDebouncedValue from '@/hook/useDebouncedValue'
import { SUGGESTION_DEBOUNCE_MS } from '@/ui-policy'

import useCensorshipSuggestionsQuery from './useCensorshipSuggestionsQuery'

export type CensorshipSuggestion = {
  value: string
  label: string
}

type Props = {
  inputValue: string
  cursorPosition: number
}

export default function useCensorshipSuggestions({ inputValue, cursorPosition }: Props) {
  const currentWord = getCurrentWord(inputValue, cursorPosition)

  const debouncedWord = useDebouncedValue({
    value: currentWord.word,
    delay: SUGGESTION_DEBOUNCE_MS,
  })

  const { data: suggestions, isLoading, isFetching } = useCensorshipSuggestionsQuery({ query: debouncedWord })

  function selectSuggestion(suggestion: CensorshipSuggestion): string {
    const before = inputValue.slice(0, currentWord.start)
    const after = inputValue.slice(currentWord.end)
    const needsSpace = before.length > 0 && !before.endsWith(' ')
    return before + (needsSpace ? ' ' : '') + suggestion.value + after
  }

  return {
    suggestions,
    selectSuggestion,
    currentWord,
    debouncedWord,
    isLoading,
    isFetching,
  }
}

function getCurrentWord(inputValue: string, cursorPosition: number) {
  if (!inputValue) {
    return { word: '', start: 0, end: 0 }
  }

  const lastComma = inputValue.lastIndexOf(',', cursorPosition - 1)
  const nextComma = inputValue.indexOf(',', cursorPosition)
  const start = lastComma + 1
  const end = nextComma === -1 ? inputValue.length : nextComma
  const segment = inputValue.slice(start, end)
  const trimStart = segment.length - segment.trimStart().length

  return {
    word: segment.trim(),
    start: start + trimStart,
    end,
  }
}
