'use client'

import { useMemo, useState } from 'react'

import { DEFAULT_SUGGESTIONS } from '@/constants/json'
import { SUGGESTION_DEBOUNCE_MS } from '@/constants/policy'
import useDebouncedValue from '@/hook/useDebouncedValue'

import useCensorshipSuggestionsQuery from './useCensorshipSuggestionsQuery'

export type CensorshipSuggestion = {
  value: string
  label: string
}

const INITIAL_SELECTED_INDEX = -1

type Props = {
  inputValue: string
  cursorPosition: number
}

export default function useCensorshipSuggestions({ inputValue, cursorPosition }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(INITIAL_SELECTED_INDEX)

  const currentWord = useMemo(() => {
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
      word: segment.trim().toLowerCase(),
      start: start + trimStart,
      end,
    }
  }, [inputValue, cursorPosition])

  const debouncedWord = useDebouncedValue({
    value: currentWord.word,
    delay: SUGGESTION_DEBOUNCE_MS,
  })

  const {
    data: suggestions = DEFAULT_SUGGESTIONS,
    isLoading,
    isFetching,
  } = useCensorshipSuggestionsQuery({ query: debouncedWord })

  function navigateSelection(direction: 'down' | 'up') {
    const len = suggestions.length
    if (len === 0) {
      return
    }

    setSelectedIndex((prev) => {
      if (direction === 'down') {
        return prev === len - 1 ? 0 : prev + 1
      } else {
        return prev <= 0 ? len - 1 : prev - 1
      }
    })
  }

  function selectSuggestion(suggestion: CensorshipSuggestion): string {
    const before = inputValue.slice(0, currentWord.start)
    const after = inputValue.slice(currentWord.end)
    const needsSpace = before.length > 0 && !before.endsWith(' ')
    return before + (needsSpace ? ' ' : '') + suggestion.value + after
  }

  return {
    suggestions,
    selectedIndex,
    resetSelection: () => setSelectedIndex(INITIAL_SELECTED_INDEX),
    navigateSelection,
    selectSuggestion,
    currentWord,
    debouncedWord,
    isLoading,
    isFetching,
  }
}
