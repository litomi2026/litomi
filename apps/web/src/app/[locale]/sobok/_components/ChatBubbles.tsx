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

// standalone(컴포저 위 미리보기 칩)만 진짜 버튼. onMessage는 말풍선 안에 중첩되는데 말풍선
// 자체가 버튼인 경우가 있어(선택-답장) button>button 중첩이 invalid HTML — span + 전파 차단으로
// 포인터 점프 어포던스만 제공하고, 키보드 기본 동작은 바깥 말풍선(선택)이 갖는다.
export function QuotedMessage({ className = '', label, onClick, preview, variant }: QuotedMessageProps) {
  const shared = 'flex min-w-0 flex-col items-start border-l-2 pl-2 text-left transition-opacity hover:opacity-70'

  if (variant === 'standalone') {
    return (
      <button type="button" onClick={onClick} className={`${shared} border-indigo-400 ${className}`}>
        <span className="max-w-full truncate text-xs font-semibold text-indigo-500">{label}</span>
        <span className="line-clamp-1 max-w-full text-xs leading-snug text-zinc-400">{preview}</span>
      </button>
    )
  }

  return (
    // 부모 말풍선이 버튼이라 여기에 role/tabIndex를 주면 다시 interactive content 중첩이 된다 —
    // 점프는 포인터 전용 보조 어포던스로 두고, 키보드 기본 동작은 말풍선(선택)에 남긴다.
    <span
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`${shared} cursor-pointer border-white/45 ${className}`}
    >
      <span className="max-w-full truncate text-xs font-semibold text-white">{label}</span>
      <span className="line-clamp-1 max-w-full text-xs leading-snug text-white/75">{preview}</span>
    </span>
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
            aria-pressed={isTarget}
            data-highlighted={isHighlighted || undefined}
            onClick={onSelect}
            className="flex flex-col gap-1.5 text-left px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-zinc-800 text-foreground border border-foreground/10 transition-all aria-pressed:border-indigo-400 data-[highlighted]:ring-2 data-[highlighted]:ring-indigo-400/80"
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
  isHighlighted: boolean
  isRead: boolean
  message: BubbleMessage
  onQuoteClick?: (messageId: string) => void
  quote?: BubbleQuote
}

export function FanReplyBubble({ isHighlighted, isRead, message, onQuoteClick, quote }: FanReplyBubbleProps) {
  const locale = useLocale()
  const t = useTranslations('Sobok.fanRoom')

  return (
    <div className="flex justify-end w-full">
      <div className="flex max-w-[80%] flex-col items-end">
        <div className="flex items-end gap-1.5 flex-row-reverse">
          <div
            data-highlighted={isHighlighted || undefined}
            className="flex flex-col gap-1.5 px-3.5 py-2 rounded-2xl rounded-br-sm shadow-sm text-base leading-relaxed bg-indigo-500 text-white data-[highlighted]:ring-2 data-[highlighted]:ring-indigo-300/80"
          >
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
