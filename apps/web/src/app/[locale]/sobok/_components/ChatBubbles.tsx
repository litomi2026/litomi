import { Check, CheckCheck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { formatTime } from '../_lib/format'

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

// The minimal shape every bubble needs from a feed item.
interface BubbleMessage {
  messageId: string
  content: { text: string }
  createdAt: string
}

export interface BubbleQuote {
  targetId: string
  label: string
  preview: string
}

// An artist message on the left: a broadcast bubble or a 1:1 answer. Both are selectable (tap
// to reply). A 1:1 answer additionally carries a quote of the fan message it answers.
interface ArtistBubbleProps {
  avatarSrc: string
  isHighlighted: boolean
  isTarget: boolean
  message: BubbleMessage
  onQuoteClick?: (messageId: string) => void
  onSelect: () => void
  quote?: BubbleQuote
}

export function ArtistBubble({
  avatarSrc,
  isHighlighted,
  isTarget,
  message,
  onQuoteClick,
  onSelect,
  quote,
}: ArtistBubbleProps) {
  const locale = useLocale()

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
            className={`flex flex-col gap-1.5 text-left px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-zinc-800 text-foreground border transition-all ${
              isTarget ? 'border-indigo-400' : 'border-foreground/10'
            } ${isHighlighted ? 'ring-2 ring-indigo-400/80' : ''}`}
          >
            {quote && (
              <QuotedMessage
                label={quote.label}
                onClick={() => onQuoteClick?.(quote.targetId)}
                preview={quote.preview}
                variant="onMessage"
              />
            )}
            <span>{message.content.text}</span>
          </button>
          <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
            {formatTime(message.createdAt, locale)}
          </span>
        </div>
      </div>
    </div>
  )
}

// The fan's own reply on the right, with a Telegram-style two-state receipt above the time:
// single gray check = sent (persisted), double indigo check = the artist's reply-room watermark
// has passed this message (room-level receipt). No delivered state — there is no per-device ack.
interface FanReplyBubbleProps {
  isRead: boolean
  message: BubbleMessage
  onQuoteClick?: (messageId: string) => void
  quote?: BubbleQuote
}

export function FanReplyBubble({ isRead, message, onQuoteClick, quote }: FanReplyBubbleProps) {
  const locale = useLocale()
  const t = useTranslations('Sobok.fanRoom')

  return (
    <div className="flex justify-end w-full">
      <div className="flex max-w-[80%] flex-col items-end">
        <div className="flex items-end gap-1.5 flex-row-reverse">
          <div className="flex flex-col gap-1.5 px-3.5 py-2 rounded-2xl rounded-br-sm shadow-sm text-base leading-relaxed bg-indigo-500 text-white">
            {quote && (
              <QuotedMessage
                label={quote.label}
                onClick={() => onQuoteClick?.(quote.targetId)}
                preview={quote.preview}
                variant="onMessage"
              />
            )}
            <span className="wrap-break-word whitespace-pre-wrap">{message.content.text}</span>
          </div>
          <div className="flex flex-col items-end mb-0.5 shrink-0">
            {isRead ? (
              <CheckCheck aria-label={t('read')} className="w-3.5 h-3.5 text-indigo-400" role="img" />
            ) : (
              <Check aria-label={t('sent')} className="w-3.5 h-3.5 text-zinc-600" role="img" />
            )}
            <span className="text-[10px] text-zinc-400 font-medium">{formatTime(message.createdAt, locale)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
