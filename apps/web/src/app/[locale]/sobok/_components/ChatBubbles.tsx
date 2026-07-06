import { Check, CheckCheck } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import type { QuoteInfo } from '../_lib/chat'
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

// A quote header carried on a bubble (points at the message this one answers).
export interface BubbleQuote {
  targetId: string
  label: string
  preview: string
}

// Attach a label to a computed quote — "me" when it's the viewer's own message, else the other
// party's name (a constant in the fan room, per-fan in the reply room).
export function toBubbleQuote(
  quote: QuoteInfo | undefined,
  labels: { mine: string; other: string },
): BubbleQuote | undefined {
  if (!quote) {
    return undefined
  }

  return {
    targetId: quote.targetId,
    preview: quote.preview,
    label: quote.isMine ? labels.mine : labels.other,
  }
}

function QuoteHeader({ quote, onQuoteClick }: { quote: BubbleQuote; onQuoteClick?: (targetId: string) => void }) {
  return (
    <QuotedMessage
      label={quote.label}
      onClick={() => onQuoteClick?.(quote.targetId)}
      preview={quote.preview}
      variant="onMessage"
    />
  )
}

// The other party's message on the left (avatar + optional sender name). Tappable to pick it as
// the reply/answer target (aria-pressed) when `onSelect` is given. Fan room: the artist's
// broadcasts/answers. Studio reply room: each fan's reply (with the fan's name).
interface IncomingBubbleProps {
  avatarSrc: string
  text: string
  createdAt: string
  senderName?: string
  quote?: BubbleQuote
  onQuoteClick?: (targetId: string) => void
  onSelect?: () => void
  isSelected?: boolean
  isHighlighted?: boolean
}

const INCOMING_BUBBLE =
  'flex flex-col gap-1.5 text-left px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-zinc-800 text-foreground border border-foreground/10 transition-colors data-[highlighted]:ring-2 data-[highlighted]:ring-indigo-400/80'

export function IncomingBubble({
  avatarSrc,
  text,
  createdAt,
  senderName,
  quote,
  onQuoteClick,
  onSelect,
  isSelected = false,
  isHighlighted = false,
}: IncomingBubbleProps) {
  const locale = useLocale()

  const body = (
    <>
      {quote && <QuoteHeader quote={quote} onQuoteClick={onQuoteClick} />}
      <span>{text}</span>
    </>
  )

  return (
    <div className="flex w-full justify-start">
      <div className="flex max-w-[80%] flex-row items-end gap-2">
        <img
          src={avatarSrc}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full border border-foreground/10 object-cover shadow-sm"
        />
        <div className="flex flex-col items-start">
          {senderName && (
            <span className="mb-1 ml-1 text-xs font-medium tracking-tight text-zinc-400">{senderName}</span>
          )}
          <div className="flex items-end gap-1.5">
            {onSelect ? (
              <button
                type="button"
                aria-pressed={isSelected}
                data-highlighted={isHighlighted || undefined}
                onClick={onSelect}
                className={`${INCOMING_BUBBLE} aria-pressed:border-indigo-400`}
              >
                {body}
              </button>
            ) : (
              <div data-highlighted={isHighlighted || undefined} className={INCOMING_BUBBLE}>
                {body}
              </div>
            )}
            <span className="mb-0.5 shrink-0 text-[10px] font-medium text-zinc-400">
              {formatTime(createdAt, locale)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Own message on the right. `receipt` renders the Telegram-style ✓/✓✓ (fan's replies); `footer`
// hangs a row under the bubble (broadcast → reply-room link). No delivered state — no per-device ack.
interface OutgoingBubbleProps {
  text: string
  createdAt: string
  quote?: BubbleQuote
  onQuoteClick?: (targetId: string) => void
  isHighlighted?: boolean
  receipt?: 'read' | 'sent'
  footer?: ReactNode
}

export function OutgoingBubble({
  text,
  createdAt,
  quote,
  onQuoteClick,
  isHighlighted = false,
  receipt,
  footer,
}: OutgoingBubbleProps) {
  const locale = useLocale()
  const t = useTranslations('Sobok.fanRoom')
  const time = <span className="text-[10px] font-medium text-zinc-400">{formatTime(createdAt, locale)}</span>

  return (
    <div className="flex w-full justify-end">
      <div className="flex max-w-[80%] flex-col items-end gap-1">
        <div className="flex flex-row-reverse items-end gap-1.5">
          <div
            data-highlighted={isHighlighted || undefined}
            className="flex flex-col gap-1.5 rounded-2xl rounded-br-sm bg-indigo-500 px-3.5 py-2 text-base leading-relaxed text-white shadow-sm data-highlighted:ring-2 data-highlighted:ring-indigo-300/80"
          >
            {quote && <QuoteHeader quote={quote} onQuoteClick={onQuoteClick} />}
            <span className="wrap-break-word whitespace-pre-wrap">{text}</span>
          </div>
          {receipt ? (
            <div className="mb-0.5 flex shrink-0 flex-col items-end">
              {receipt === 'read' ? (
                <CheckCheck aria-label={t('read')} className="h-3.5 w-3.5 text-indigo-400" role="img" />
              ) : (
                <Check aria-label={t('sent')} className="h-3.5 w-3.5 text-zinc-600" role="img" />
              )}
              {time}
            </div>
          ) : (
            <span className="mb-0.5 shrink-0">{time}</span>
          )}
        </div>
        {footer}
      </div>
    </div>
  )
}
