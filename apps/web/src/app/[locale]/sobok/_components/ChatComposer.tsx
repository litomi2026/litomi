'use client'

import { Image as ImageIcon, Send } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder: string
  disabled?: boolean
}

export default function ChatComposer({ value, onChange, onSend, placeholder, disabled = false }: ChatComposerProps) {
  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="flex items-center gap-2 p-1.5 pr-2">
      <button className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors shrink-0" type="button">
        <ImageIcon className="w-6 h-6" />
      </button>
      <TextareaAutosize
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            onSend()
          }
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none py-2.5 px-1 text-foreground placeholder-zinc-500 resize-none outline-none max-h-28"
        maxRows={4}
        disabled={disabled}
      />
      <button
        className="p-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400/40 text-white rounded-full transition-all shrink-0 shadow-sm"
        disabled={!canSend}
        onClick={onSend}
        type="button"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}
