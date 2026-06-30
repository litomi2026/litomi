'use client'

import { Image as ImageIcon, Send } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder: string
  // Disables the textarea and send (request in flight, or no valid target). The send button
  // additionally requires non-empty text.
  disabled?: boolean
}

// The shared message input: image button + auto-sizing textarea + send. Enter sends,
// Shift+Enter inserts a newline. State is owned by the parent (controlled).
export default function ChatComposer({ value, onChange, onSend, placeholder, disabled = false }: ChatComposerProps) {
  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="flex items-end gap-2 bg-gray-100/60 dark:bg-white/5 rounded-3xl p-1.5 pr-2 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
      <button className="p-2 text-gray-400 hover:text-indigo-500 transition-colors shrink-0" type="button">
        <ImageIcon className="w-[22px] h-[22px]" />
      </button>
      <TextareaAutosize
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none py-[10px] px-1 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-none max-h-28"
        maxRows={4}
        disabled={disabled}
      />
      <button
        className="p-[9px] bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 disabled:dark:bg-indigo-900 text-white rounded-full transition-all shrink-0 shadow-sm"
        disabled={!canSend}
        onClick={onSend}
        type="button"
      >
        <Send className="w-4 h-4 ml-0.5" />
      </button>
    </div>
  )
}
