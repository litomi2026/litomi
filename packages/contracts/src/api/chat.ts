import { z } from 'zod'

const CHAT_TEXT_MAX_LENGTH = 2000
// 답장의 정적 상한 — 팬별 동적 한도(기본 30자 + 연속 구독 보너스)의 절대 최댓값과 일치해야 합니다.
const CHAT_REPLY_TEXT_MAX_LENGTH = 300

// 미디어(image/voice/video)는 자사 스토리지 업로드 파이프라인 도입 시 다시 확장합니다.
export type ChatContentType = 'text'

const MESSAGE_ID_MAX_LENGTH = 26 // ULID
const messageIdCursorSchema = z.string().min(1).max(MESSAGE_ID_MAX_LENGTH)

export const chatHandleParamSchema = z.object({
  handle: z.string().min(1),
})

// A message (broadcast message) is addressed by its messageId (a ULID).
export const chatMessageParamSchema = z.object({
  handle: z.string().min(1),
  messageId: z.string().min(1).max(MESSAGE_ID_MAX_LENGTH),
})

export const postV1ChatMessageBodySchema = z.object({
  contentType: z.literal('text'),
  text: z.string().trim().min(1).max(CHAT_TEXT_MAX_LENGTH),
})

export type POSTV1ChatMessageBody = z.infer<typeof postV1ChatMessageBodySchema>

export interface POSTV1ChatMessageResponse {
  messageId: string
}

// 팬 답장 — 스키마 상한은 절대 최댓값이고, 실제 허용 길이는 라우트에서 팬별 한도로 검증합니다.
export const postV1ChatReplyBodySchema = z.object({
  contentType: z.literal('text'),
  text: z.string().trim().min(1).max(CHAT_REPLY_TEXT_MAX_LENGTH),
})

export type POSTV1ChatReplyBody = z.infer<typeof postV1ChatReplyBodySchema>
export type POSTV1ChatReplyResponse = POSTV1ChatMessageResponse

// --- Shared DTOs --------------------------------------------------------------

export type ChatMessageContent = { text: string }

export type ChatRelayMessageDTO =
  | (ChatMessageDTO & { kind: 'broadcast' })
  | (ChatReplyDTO & {
      kind: 'reply'
      sender?: { nickname: string; imageURL: string | null }
    })

// A broadcast message as seen on the timeline.
export interface ChatMessageDTO {
  messageId: string
  senderId: number
  contentType: ChatContentType
  content: ChatMessageContent
  createdAt: string
}

// A fan's reply to a specific message.
export interface ChatReplyDTO {
  messageId: string
  targetMessageId: string
  senderId: number
  contentType: ChatContentType
  content: ChatMessageContent
  createdAt: string
}

export interface ChatMessagePreview {
  messageId: string
  senderId: number
  contentType: ChatContentType
  preview: string
  createdAt: string
}

export interface ChatArtistBrief {
  id: number
  handle: string
  displayName: string
  imageURL: string | null
  emoji: string | null
  // Only populated on the artist resource (subscribe landing); omitted in list/relay contexts.
  description?: string | null
}

export interface ChatUserBrief {
  id: number
  nickname: string
  imageURL: string | null
}

// --- Timeline (message-centric) ------------------------------------------------

export const getV1ChatMessagesQuerySchema = z.object({
  // Page backwards in time (older than this messageId) — the default scroll-up behavior.
  before: messageIdCursorSchema.optional(),
  // Page/sync forwards in time (newer than this messageId), e.g. after a reconnect.
  after: messageIdCursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

// One message on the timeline. Role-specific fields:
//   - fan:   myReplies + artistReadMyReplies (whether the artist has read them)
//   - owner: unreadReplyCount (new replies on this message, capped)
export interface ChatTimelineMessage {
  message: ChatMessageDTO
  myReplies?: ChatReplyDTO[]
  artistReadMyReplies?: boolean
  unreadReplyCount?: number
}

export interface GETV1ChatMessagesResponse {
  messages: ChatTimelineMessage[]
  // Pass back as `before` to load the previous page; absent when the stream start is reached.
  nextCursor?: string
}

// --- Mark-as-read -------------------------------------------------------------
// Fan: advances the broadcast watermark. Owner: marks one message's reply room read.
export const putV1ChatReadBodySchema = z.object({
  lastReadMessageId: messageIdCursorSchema,
})

export type PUTV1ChatReadBody = z.infer<typeof putV1ChatReadBodySchema>

// --- Fan chat list ------------------------------------------------------------

export interface ChatThreadListItem {
  artist: ChatArtistBrief
  // false = a lapsed subscription kept reachable for its paid-window broadcast archive
  // (read-only; sending disabled until re-subscribe). true = currently entitled.
  entitled: boolean
  lastMessage?: ChatMessagePreview
  unreadCount: number
}

export interface GETV1ChatThreadsResponse {
  threads: ChatThreadListItem[]
}

// --- Subscription (shared M3 billing) -----------------------------------------

export type ChatSubscriptionStatus = 'incomplete' | 'active' | 'past_due' | 'canceled' | 'expired'

// The viewer's own subscription to an artist. `expiresAt` is the access boundary; when
// `autoRenew` is false a cancel is pending and access ends at that date.
export interface ChatSubscriptionDTO {
  status: ChatSubscriptionStatus
  expiresAt: string
  autoRenew: boolean
}

// The monthly price to subscribe to an artist. null = the artist is not open for subscription.
export interface ChatArtistPrice {
  amount: number
  currency: string
}

// Subscribe funds the first charge from a saved billing key (issued client-side first).
export const postV1ChatSubscriptionBodySchema = z.object({
  paymentMethodId: z.number().int().positive(),
})

export interface POSTV1ChatSubscriptionResponse {
  subscription: ChatSubscriptionDTO
}

export interface DELETEV1ChatSubscriptionResponse {
  subscription: ChatSubscriptionDTO
}

// 청약철회 — 최근 결제를 전액 환불. 조건(결제 7일 이내 + 해당 기간 답장 미발신)은 서버가 검증한다.
export interface POSTV1ChatSubscriptionRefundResponse {
  subscription: ChatSubscriptionDTO
}

// --- Artist self-service (onboarding + studio settings) -----------------------

// 공개 페이지(/sobok/@{handle})와 스튜디오 주소에 쓰이는 핸들. 변경 가능. @ 네임스페이스 덕에
// 라우트 세그먼트와 충돌하지 않으므로 예약어는 운영 주체 사칭 방지용만 남긴다. 서브도메인 승격
// 가능성에 대비해 DNS 라벨 규칙(하이픈 구분자, 영숫자 시작·끝)을 따른다.
export const RESERVED_CHAT_HANDLES = new Set([
  'admin',
  'administrator',
  'help',
  'litomi',
  'moderator',
  'notice',
  'official',
  'sobok',
  'staff',
  'support',
  'system',
])

const chatArtistHandleSchema = z
  .string()
  .min(3, '핸들은 3~32자여야 해요.')
  .max(32, '핸들은 3~32자여야 해요.')
  .regex(
    /^[a-z0-9](?:-?[a-z0-9])*$/,
    '핸들은 영문 소문자, 숫자, 하이픈(-)만 쓸 수 있고, 하이픈은 처음·끝·연속으로 쓸 수 없어요.',
  )
  .refine((handle) => !RESERVED_CHAT_HANDLES.has(handle), '사용할 수 없는 핸들이에요.')

const CHAT_ARTIST_NAME_MAX_LENGTH = 64
const CHAT_ARTIST_DESCRIPTION_MAX_LENGTH = 500
const CHAT_ARTIST_EMOJI_MAX_LENGTH = 16
// 0 = 구독 미오픈. 열려 있다면 1,000원 이상 1,000,000원 이하.
const CHAT_ARTIST_PRICE_MIN = 1_000
const CHAT_ARTIST_PRICE_MAX = 1_000_000

const chatArtistPriceAmountSchema = z
  .number()
  .int()
  .min(0)
  .max(CHAT_ARTIST_PRICE_MAX)
  .refine(
    (amount) => amount === 0 || amount >= CHAT_ARTIST_PRICE_MIN,
    `구독 가격은 ${CHAT_ARTIST_PRICE_MIN.toLocaleString('ko-KR')}원 이상이어야 해요.`,
  )

export const postV1ChatArtistBodySchema = z.object({
  handle: chatArtistHandleSchema,
  displayName: z.string().trim().min(1).max(CHAT_ARTIST_NAME_MAX_LENGTH),
  description: z.string().trim().min(1).max(CHAT_ARTIST_DESCRIPTION_MAX_LENGTH).nullable(),
  emoji: z.string().trim().min(1).max(CHAT_ARTIST_EMOJI_MAX_LENGTH).nullable(),
  priceAmount: chatArtistPriceAmountSchema,
  // 성인 콘텐츠 비허용 정책 동의 — 미동의는 온보딩 자체가 불가능하다.
  agreeContentPolicy: z.literal(true),
})

export type POSTV1ChatArtistBody = z.infer<typeof postV1ChatArtistBodySchema>

export const patchV1ChatArtistBodySchema = z
  .object({
    handle: chatArtistHandleSchema.optional(),
    displayName: z.string().trim().min(1).max(CHAT_ARTIST_NAME_MAX_LENGTH).optional(),
    description: z.string().trim().min(1).max(CHAT_ARTIST_DESCRIPTION_MAX_LENGTH).nullable().optional(),
    emoji: z.string().trim().min(1).max(CHAT_ARTIST_EMOJI_MAX_LENGTH).nullable().optional(),
    priceAmount: chatArtistPriceAmountSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, '변경할 항목이 없어요.')

export type PATCHV1ChatArtistBody = z.infer<typeof patchV1ChatArtistBodySchema>

// 소유자 본인이 보는 자기 아티스트 프로필(스튜디오 설정의 전체 편집 상태).
export interface ChatArtistMine {
  id: number
  handle: string
  displayName: string
  description: string | null
  imageURL: string | null
  emoji: string | null
  priceAmount: number
  priceCurrency: string
  isActive: boolean
}

// 스튜디오 진입점 — 내 아티스트 프로필 조회. null = 아직 온보딩 전.
export interface GETV1ChatStudioResponse {
  artist?: ChatArtistMine
}

export interface POSTV1ChatArtistResponse {
  artist: ChatArtistMine
}

export interface PATCHV1ChatArtistResponse {
  artist: ChatArtistMine
}

// --- Studio earnings (월 정산 — 수수료 25%, 원천징수 3.3%, 최소 지급 1만원) -----

export type ChatPayoutStatus = 'carried' | 'paid' | 'pending'

// 한 달 치 정산 명세. payable = (gross − refund) − fee − withholding + carriedIn.
export interface ChatPayoutDTO {
  periodStart: string
  periodEnd: string
  grossAmount: number
  refundAmount: number
  feeAmount: number
  withholdingAmount: number
  carriedInAmount: number
  payableAmount: number
  currency: string
  status: ChatPayoutStatus
  paidAt?: string
}

export interface ChatPayoutAccountDTO {
  bankName: string
  // 마지막 4자리만 노출 — 원문은 서버에 암호화 저장된다.
  accountNumberMasked: string
  holderName: string
}

export interface GETV1ChatStudioEarningsResponse {
  account?: ChatPayoutAccountDTO
  // 진행 중인 이번 달(KST)의 실시간 집계 — 마감 전 추정치.
  currentMonth: {
    grossAmount: number
    refundAmount: number
    estimatedPayableAmount: number
  }
  payouts: ChatPayoutDTO[]
}

export const putV1ChatPayoutAccountBodySchema = z.object({
  bankName: z.string().trim().min(1).max(32),
  accountNumber: z
    .string()
    .trim()
    .regex(/^[0-9-]{6,32}$/, '계좌번호 형식이 올바르지 않아요.'),
  holderName: z.string().trim().min(1).max(32),
})

export type PUTV1ChatPayoutAccountBody = z.infer<typeof putV1ChatPayoutAccountBodySchema>

export interface PUTV1ChatPayoutAccountResponse {
  account: ChatPayoutAccountDTO
}

// --- Artist resource (resolve handle → id + viewer's role) -------------------

export interface GETV1ChatArtistResponse {
  artist: ChatArtistBrief
  // The viewer owns this artist (→ studio).
  isOwner: boolean
  // The viewer may currently read the live broadcast (owner or paid-up fan).
  entitled: boolean
  // Monthly subscription price; absent = not open for subscription.
  price?: ChatArtistPrice
  // The viewer's subscription state (for the manage/resubscribe panel); absent = never subscribed.
  subscription?: ChatSubscriptionDTO
  // Max reply text length (grows with continuous subscription); absent = owner or not entitled.
  // The per-message reply count is fixed: REPLY_MAX_PER_MESSAGE in @litomi/domain/chat/policy.
  replyTextLimit?: number
}

// --- Artist reply room (all fans' replies to one message) ---------------------

export const getV1ChatRepliesQuerySchema = z.object({
  before: messageIdCursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export interface ChatReplyWithFan extends ChatReplyDTO {
  fan?: ChatUserBrief
}

export interface GETV1ChatRepliesResponse {
  replies: ChatReplyWithFan[]
  nextCursor?: string
}
