'use client'

import { useQueryClient } from '@tanstack/react-query'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import IconInfo from '@/components/icons/IconInfo'
import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'
import { BLIND_TAG_VALUES } from '@/constants/json'
import { QueryKeys } from '@/constants/query'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import useActionResponse from '@/hook/useActionResponse'

import { addCensorships } from './action'
import useCensorshipSuggestions, { type CensorshipSuggestion } from './useCensorshipSuggestions'

const TYPE_PATTERNS: Record<string, CensorshipKey> = {
  'artist:': CensorshipKey.ARTIST,
  'group:': CensorshipKey.GROUP,
  'series:': CensorshipKey.SERIES,
  'character:': CensorshipKey.CHARACTER,
  'female:': CensorshipKey.TAG_CATEGORY_FEMALE,
  'male:': CensorshipKey.TAG_CATEGORY_MALE,
  'mixed:': CensorshipKey.TAG_CATEGORY_MIXED,
  'other:': CensorshipKey.TAG_CATEGORY_OTHER,
}

export default memo(CensorshipCreationBar)

function CensorshipCreationBar() {
  const [showHelp, setShowHelp] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const [_, dispatchAddAction, isSubmitting] = useActionResponse({
    action: addCensorships,
    onSuccess: (items) => {
      toast.success(`${items?.length ?? 0}개의 검열 규칙을 추가했어요`)
      setInputValue('')
      setCursorPosition(0)
      setShowSuggestions(false)
      resetSelection()
      inputRef.current?.blur()
      queryClient.invalidateQueries({ queryKey: QueryKeys.censorships })
    },
  })

  const {
    suggestions,
    selectedIndex,
    setSelectedIndex,
    resetSelection,
    navigateSelection,
    selectSuggestion,
    currentWord,
    debouncedWord,
    isLoading,
    isFetching,
  } = useCensorshipSuggestions({
    inputValue,
    cursorPosition,
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!inputValue?.trim()) {
      return
    }

    const items = inputValue
      .split(/[,\n]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)

    if (items.length === 0) {
      return
    }

    const bulkFormData = new FormData()

    for (const item of items) {
      const { key, value } = detectTypeAndValue(item)
      bulkFormData.append('key', key.toString())
      bulkFormData.append('value', value)
      bulkFormData.append('level', CensorshipLevel.LIGHT.toString())
    }

    dispatchAddAction(bulkFormData)
  }

  const updateCursorPosition = useCallback(() => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0)
    }
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const position = e.target.selectionStart || 0

      setInputValue(value)
      setCursorPosition(position)
      setShowSuggestions(true)
      resetSelection()
    },
    [resetSelection],
  )

  const handleFocus = useCallback(() => {
    setShowSuggestions(true)
    resetSelection()
    updateCursorPosition()
  }, [resetSelection, updateCursorPosition])

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (!suggestionsRef.current?.contains(e.relatedTarget)) {
        setTimeout(() => {
          setShowSuggestions(false)
          resetSelection()
        }, 200)
      }
    },
    [resetSelection],
  )

  const handleSelectSuggestion = useCallback(
    (suggestion: CensorshipSuggestion) => {
      const newValue = selectSuggestion(suggestion)
      setInputValue(newValue)

      // Set cursor position after the selected suggestion
      const newCursorPos = currentWord.start + suggestion.value.length
      setCursorPosition(newCursorPos)

      setShowSuggestions(false)
      resetSelection()
      inputRef.current?.focus()

      // Set cursor position in the input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursorPos
        }
      }, 0)
    },
    [selectSuggestion, currentWord, resetSelection],
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        formRef.current?.requestSubmit()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        navigateSelection('down')
        break
      case 'ArrowUp':
        e.preventDefault()
        navigateSelection('up')
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex])
        } else {
          formRef.current?.requestSubmit()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        resetSelection()
        break
      case 'Tab':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
    }
  }

  // NOTE: 선택된 곳으로 스크롤을 이동함
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement

      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  return (
    <div className="space-y-2 relative">
      <form className="relative" onSubmit={handleSubmit} ref={formRef}>
        <input
          autoCapitalize="off"
          autoComplete="off"
          className="w-full pl-4 pr-20 sm:pr-12 py-3 bg-zinc-800/70 rounded-lg border-2 border-zinc-700 outline-none transition
          focus:border-brand-end focus:bg-zinc-800 placeholder:text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
          name="censorships"
          onBlur={handleBlur}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onSelect={updateCursorPosition}
          placeholder="검열할 키워드를 입력해주세요"
          ref={inputRef}
          type="text"
          value={inputValue}
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            className="p-2 rounded text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50 transition"
            onClick={() => setShowHelp(!showHelp)}
            title="도움말"
            type="button"
          >
            <IconInfo className="w-4" />
          </button>
          <button
            className="p-2 rounded hover:bg-zinc-800 disabled:bg-transparent disabled:cursor-not-allowed transition"
            disabled={isSubmitting}
            title="검열 추가 (Enter)"
            type="submit"
          >
            {isSubmitting ? <IconSpinner className="w-4" /> : '등록'}
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden"
          ref={suggestionsRef}
        >
          <div className="max-h-64 overflow-y-auto relative">
            {isLoading && suggestions.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <IconSpinner className="w-5 text-zinc-400" />
              </div>
            )}
            <div aria-busy={isFetching} className="transition aria-busy:opacity-60">
              {suggestions.map((suggestion, index) => (
                <button
                  aria-current={selectedIndex === index}
                  className="w-full px-4 py-2.5 text-left hover:bg-zinc-700/50 transition flex items-center justify-between aria-current:bg-zinc-700/70"
                  data-index={index}
                  key={suggestion.value}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelectSuggestion(suggestion)
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  type="button"
                >
                  <div className="flex flex-col flex-1">
                    <span className="text-sm">
                      {suggestion.value.endsWith(':') ? (
                        <>
                          <span className="text-brand-end font-medium">{suggestion.value}</span>
                          <span className="text-zinc-400 ml-1">{suggestion.label.replace(':', '')}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-zinc-200">{suggestion.value}</span>
                          {suggestion.label !== suggestion.value && (
                            <span className="text-zinc-400 ml-1">({suggestion.label})</span>
                          )}
                        </>
                      )}
                    </span>
                    {BLIND_TAG_VALUES.includes(suggestion.value) && (
                      <span className="text-xs text-orange-500 mt-0.5">기본 검열 태그</span>
                    )}
                  </div>
                  {suggestion.value.endsWith(':') && <span className="text-xs text-zinc-500">접두사</span>}
                </button>
              ))}
            </div>
            {!isLoading && suggestions.length === 0 && debouncedWord && (
              <div className="text-center py-4 text-zinc-500 text-sm">검색 결과가 없습니다</div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible help section for mobile */}
      {showHelp ? (
        <div className={`overflow-hidden`}>
          <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 p-3 text-sm space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-zinc-300">입력 형식 가이드</h3>
              <button
                className="p-1 rounded hover:bg-zinc-700/50 transition-colors"
                onClick={() => setShowHelp(false)}
                type="button"
              >
                <IconX className="w-3" />
              </button>
            </div>
            <div className="space-y-2 text-zinc-400">
              <div>
                <p className="font-medium text-zinc-300 mb-1">기본 형식</p>
                <p>
                  • 태그: <code className="text-zinc-300">scat</code>
                </p>
                <p>
                  • 여러 개: <code className="text-zinc-300">scat, gore, guro</code>
                </p>
              </div>
              <div>
                <p className="font-medium text-zinc-300 mb-1">특정 타입 지정</p>
                <p>
                  • 작가: <code className="text-zinc-300">artist:작가명</code>
                </p>
                <p>
                  • 그룹: <code className="text-zinc-300">group:그룹명</code>
                </p>
                <p>
                  • 시리즈: <code className="text-zinc-300">series:작품명</code>
                </p>
                <p>
                  • 캐릭터: <code className="text-zinc-300">character:캐릭터명</code>
                </p>
              </div>
              <div>
                <p className="font-medium text-zinc-300 mb-1">태그 카테고리</p>
                <p>
                  • 여성: <code className="text-zinc-300">female:태그명</code>
                </p>
                <p>
                  • 남성: <code className="text-zinc-300">male:태그명</code>
                </p>
                <p>
                  • 혼합: <code className="text-zinc-300">mixed:태그명</code>
                </p>
                <p>
                  • 기타: <code className="text-zinc-300">other:태그명</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-500 px-1 line-clamp-1 break-all">
          쉼표로 여러 개 입력 가능 (예: scat, male:males_only, group:zenmai_kourogi, other:ai_generated, ...)
        </p>
      )}
    </div>
  )
}

function detectTypeAndValue(text: string): { key: CensorshipKey; value: string } {
  const trimmed = text.trim()

  for (const [pattern, key] of Object.entries(TYPE_PATTERNS)) {
    if (trimmed.toLowerCase().startsWith(pattern)) {
      return {
        key,
        value: trimmed.slice(pattern.length).trim(),
      }
    }
  }

  return {
    key: CensorshipKey.TAG,
    value: trimmed,
  }
}
