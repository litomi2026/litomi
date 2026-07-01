import type { ChatMessageDTO, ChatReplyDTO } from '@litomi/contracts'
import { Check, CheckCheck } from 'lucide-react'
import { contentPreview, textOf } from '../_lib/chat'

interface QuotedMessageProps {
  className?: string
  label: string
  onClick: () => void
  preview: string
  variant: 'onMessage' | 'standalone'
}

export function QuotedMessage({ className = '', label, onClick, preview, variant }: QuotedMessageProps) {
  const accent = variant === 'onMessage' ? 'border-white/45' : 'border-indigo-400'
  const labelTone = variant === 'onMessage' ? 'text-white' : 'text-indigo-500'
  const previewTone = variant === 'onMessage' ? 'text-white/75' : 'text-zinc-400'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-col items-start border-l-2 pl-2 text-left transition-opacity hover:opacity-70 ${accent} ${className}`}
    >
      <span className={`max-w-full truncate text-xs font-semibold ${labelTone}`}>{label}</span>
      <span className={`line-clamp-1 max-w-full text-xs leading-snug ${previewTone}`}>{preview}</span>
    </button>
  )
}

interface ArtistMessageBubbleProps {
  avatarSrc: string
  isHighlighted: boolean
  isTarget: boolean
  message: ChatMessageDTO
  onSelect: () => void
}

export function ArtistMessageBubble({
  avatarSrc,
  isHighlighted,
  isTarget,
  message,
  onSelect,
}: ArtistMessageBubbleProps) {
  return (
    <div className="flex justify-start w-full">
      <div className="flex max-w-[80%] flex-row items-end gap-2">
        <img
          src={avatarSrc}
          alt=""
          className="w-9 h-9 rounded-full object-cover shadow-sm border border-foreground/10 shrink-0"
        />
        <div className="flex items-end gap-1.5">
          <button
            type="button"
            onClick={onSelect}
            className={`text-left px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-zinc-800 text-foreground border transition-all ${
              isTarget ? 'border-indigo-400' : 'border-foreground/10'
            } ${isHighlighted ? 'ring-2 ring-indigo-400/80' : ''}`}
          >
            {textOf(message.content)}
          </button>
          <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}

interface FanReplyBubbleProps {
  onQuoteClick: (messageId: string) => void
  quoteLabel: string
  quoteTarget: ChatMessageDTO | null
  read: boolean
  reply: ChatReplyDTO
}

export function FanReplyBubble({ onQuoteClick, quoteLabel, quoteTarget, read, reply }: FanReplyBubbleProps) {
  return (
    <div className="flex justify-end w-full">
      <div className="flex max-w-[80%] flex-col items-end">
        <div className="flex items-end gap-1.5 flex-row-reverse">
          <div className="flex flex-col gap-1.5 px-3.5 py-2 rounded-2xl rounded-br-sm shadow-sm text-base leading-relaxed bg-indigo-500 text-white">
            {quoteTarget && (
              <QuotedMessage
                label={quoteLabel}
                onClick={() => onQuoteClick(quoteTarget.messageId)}
                preview={contentPreview(quoteTarget.contentType, quoteTarget.content)}
                variant="onMessage"
              />
            )}
            <span className="wrap-break-word whitespace-pre-wrap">{textOf(reply.content)}</span>
          </div>
          <div className="flex flex-col items-end mb-0.5 shrink-0">
            {read ? (
              <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Check className="w-3.5 h-3.5 text-zinc-600" />
            )}
            <span className="text-[10px] text-zinc-400 font-medium">
              {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
