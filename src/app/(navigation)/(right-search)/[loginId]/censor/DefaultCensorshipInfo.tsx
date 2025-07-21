'use client'

import { useState } from 'react'

import IconInfo from '@/components/icons/IconInfo'
import IconX from '@/components/icons/IconX'
import { BLIND_TAG_VALUE_TO_LABEL, BLIND_TAG_VALUES } from '@/constants/json'

const LABEL_TO_VALUES = BLIND_TAG_VALUES.reduce<Record<string, string[]>>((acc, tag) => {
  const label = BLIND_TAG_VALUE_TO_LABEL[tag]
  if (!acc[label]) acc[label] = []
  acc[label].push(tag)
  return acc
}, {})

const DEFAULT_CENSORED_TAGS = Object.entries(LABEL_TO_VALUES).map(([label, values]) => {
  return `${label} (${values.join(', ')})`
})

export default function DefaultCensorshipInfo() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mx-4">
      <div
        aria-expanded={isExpanded}
        className="bg-zinc-800/50 rounded-lg border-2 border-zinc-700 overflow-hidden transition-all aria-expanded:max-h-96 max-h-12"
      >
        <button
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/70 transition"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 text-sm">
            <IconInfo className="w-4 text-zinc-400" />
            <span className="text-zinc-300">기본 검열 규칙이 적용되어 있어요</span>
          </div>
          <IconX aria-expanded={isExpanded} className="w-4 text-zinc-400 transition rotate-45 aria-expanded:rotate-0" />
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 text-sm text-zinc-400">
            <p className="mb-2">
              사용자 보호를 위해 다음 태그들은 기본적으로 <span className="text-yellow-500 font-medium">흐리게</span>{' '}
              처리돼요:
            </p>
            <ul className="space-y-1 mb-3">
              {DEFAULT_CENSORED_TAGS.map((tag) => (
                <li className="flex items-center gap-2" key={tag}>
                  <span className="text-zinc-500">•</span>
                  <span>{tag}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs border-t border-zinc-700 pt-3">
              💡 <span className="text-zinc-300">팁:</span> 위 태그들을 완전히 숨기려면 사용자 규칙으로 동일한 태그를{' '}
              <span className="text-red-500">숨기기</span> 검열로 추가해주세요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
