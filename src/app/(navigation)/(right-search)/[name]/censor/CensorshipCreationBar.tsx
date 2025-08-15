'use client'

import { memo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import IconInfo from '@/components/icons/IconInfo'
import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'

type Props = {
  onSubmit: (formData: FormData) => void
}

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

function CensorshipCreationBar({ onSubmit }: Readonly<Props>) {
  const [isSubmitting, startSubmission] = useTransition()
  const [showHelp, setShowHelp] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const inputValue = formData.get('censorships') as string

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

    startSubmission(() => {
      const bulkFormData = new FormData()

      for (const item of items) {
        const { key, value } = detectTypeAndValue(item)
        bulkFormData.append('key', key.toString())
        bulkFormData.append('value', value)
        bulkFormData.append('level', CensorshipLevel.LIGHT.toString())
      }

      onSubmit(bulkFormData)
      toast.success(`${items.length}개의 검열 규칙을 추가했어요`)
      formRef.current?.reset()
      inputRef.current?.blur()
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  return (
    <div className="space-y-2 relative">
      <form className="relative" onSubmit={handleSubmit} ref={formRef}>
        <input
          className="w-full pl-4 pr-20 sm:pr-12 py-3 bg-zinc-800/70 rounded-lg border-2 border-zinc-700 outline-none transition
          focus:border-brand-end focus:bg-zinc-800 placeholder:text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
          name="censorships"
          onKeyDown={handleKeyDown}
          placeholder="검열할 키워드를 입력해주세요"
          ref={inputRef}
          type="text"
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
