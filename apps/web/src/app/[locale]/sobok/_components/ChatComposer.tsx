'use client'

import { Image as ImageIcon, Send } from 'lucide-react'
import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

interface Props {
  onSend: (text: string) => Promise<void>
  placeholder: string
  disabled?: boolean
  maxLength?: number
}

export default function ChatComposer({ onSend, placeholder, disabled = false, maxLength }: Props) {
  const [value, setValue] = useState('')

  // 서버와 동일하게 코드포인트 기준으로 센다.
  const length = [...value].length
  const overLimit = maxLength !== undefined && length > maxLength
  const canSend = value.trim().length > 0 && !disabled && !overLimit

  async function handleSend() {
    try {
      await onSend(value.trim())
      setValue('')
    } catch {
      // Keep the draft.
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()

      if (canSend) {
        handleSend()
      }
    }
  }

  return (
    <div className="flex items-center gap-2 p-1.5 pr-2">
      <button className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors shrink-0" type="button">
        <ImageIcon className="w-6 h-6" />
      </button>
      <TextareaAutosize
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none py-2.5 px-1 text-foreground placeholder-zinc-500 resize-none outline-none max-h-28"
        maxRows={4}
        disabled={disabled}
      />
      {maxLength !== undefined && length > 0 && (
        <span className={`shrink-0 text-[11px] font-medium ${overLimit ? 'text-red-400' : 'text-zinc-500'}`}>
          {length}/{maxLength}
        </span>
      )}
      <button
        className="p-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400/40 text-white rounded-full transition-all shrink-0 shadow-sm"
        disabled={!canSend}
        onClick={handleSend}
        type="button"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}
