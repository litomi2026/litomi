'use client'

import type { ChatReplyRoomEntry, ChatReplyRoomMessage } from '@litomi/contracts'
import { ChevronLeft, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import useReadWatermark from '../_hooks/useReadWatermark'
import useRoomChannel from '../_hooks/useRoomChannel'
import { avatarURL } from '../_lib/chat'
import { formatTime } from '../_lib/format'
import useArtistQuery from '../_query/useArtistQuery'
import useMarkMessageReadMutation from '../_query/useMarkMessageReadMutation'
import useMessageReplyQuery from '../_query/useMessageReplyQuery'
import useSendArtistReplyMutation from '../_query/useSendArtistReplyMutation'
import { QuotedMessage } from './ChatBubbles'
import ChatComposer from './ChatComposer'
import ChatMessageList from './ChatMessageList'
import ComposerDock from './ComposerDock'

interface AnswerTarget {
  fanId: number
  replyMessageId: string
  fanName: string
  preview: string
}

export default function StudioReplyRoom({ handle, messageId }: { handle: string; messageId: string }) {
  const [liveEntries, setLiveEntries] = useState<ChatReplyRoomEntry[]>([])
  const [optimisticAnswers, setOptimisticAnswers] = useState<Record<string, ChatReplyRoomMessage[]>>({})
  const [answerTarget, setAnswerTarget] = useState<AnswerTarget | null>(null)
  const { data: artistData, isLoading: isArtistLoading } = useArtistQuery(handle)
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useMessageReplyQuery(handle, messageId)
  const { mutate: markMessageRead } = useMarkMessageReadMutation(handle, messageId)
  const { mutateAsync: postAnswer, isPending: isAnswering } = useSendArtistReplyMutation(handle, messageId)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('Sobok.replyRoom')

  const artist = artistData?.artist
  const isOwner = artistData?.isOwner
  const fetchedEntries = data?.pages.flatMap((page) => page.entries) ?? []
  const entries = mergeEntries(fetchedEntries, liveEntries, optimisticAnswers)
  const newestReplyId = entries.at(-1)?.reply.messageId

  async function sendAnswer(text: string) {
    if (!answerTarget) {
      return
    }

    const { messageId: answerId } = await postAnswer({
      fanId: answerTarget.fanId,
      body: { contentType: 'text', text, quotedMessageId: answerTarget.replyMessageId },
    })

    setOptimisticAnswers((prev) => ({
      ...prev,
      [answerTarget.replyMessageId]: [
        ...(prev[answerTarget.replyMessageId] ?? []),
        {
          messageId: answerId,
          quotedMessageId: answerTarget.replyMessageId,
          contentType: 'text',
          content: { text },
          createdAt: new Date().toISOString(),
        },
      ],
    }))
    setAnswerTarget(null)
  }

  useEffect(() => {
    if (artistData && !isOwner) {
      router.replace(`/sobok/@${handle}`)
    }
  }, [artistData, isOwner, handle, router])

  // Focused reply room (rr:, un-sampled): live fan replies to THIS message.
  useRoomChannel(artist && isOwner ? `rr:${artist.id}:${messageId}` : null, {
    onMessage: (msg) => {
      if (msg.kind !== 'fanReply' || msg.contextMessageId !== messageId) {
        return
      }

      const entry: ChatReplyRoomEntry = {
        fanId: msg.fanId,
        reply: {
          messageId: msg.messageId,
          quotedMessageId: msg.quotedMessageId,
          contentType: msg.contentType,
          content: msg.content,
          createdAt: msg.createdAt,
        },
        fan: msg.fan && { id: msg.fanId, nickname: msg.fan.nickname, imageURL: msg.fan.imageURL },
        answers: [],
      }

      setLiveEntries((prev) => (prev.some((e) => e.reply.messageId === msg.messageId) ? prev : [...prev, entry]))
    },
  })

  // Mark the room read up to the newest fan reply → clears the studio's unread badge and
  // surfaces as the fan's "읽음" receipt. Gated on tab visibility + throttled by the hook.
  useReadWatermark(newestReplyId, (lastReadMessageId) => markMessageRead({ lastReadMessageId }))

  if (isArtistLoading || !artist || !isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/30" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center px-2 border-b border-foreground/10 bg-background/80">
        <Link href={`/sobok/studio/${handle}`} className="p-2 text-zinc-400 hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h2 className="font-bold text-lg text-foreground ml-2">{t('title')}</h2>
      </div>

      {/* Each fan's reply, with the artist's answers threaded under it */}
      <ChatMessageList
        bottomInsetClassName="pb-[var(--sobok-dock-h)]"
        dateOf={(entry) => new Date(entry.reply.createdAt).getTime()}
        emptyState={<p className="text-sm text-zinc-400">{t('empty')}</p>}
        hasOlder={hasNextPage}
        isLoadingOlder={isFetchingNextPage}
        itemKey={(entry) => entry.reply.messageId}
        items={entries}
        onLoadOlder={fetchNextPage}
        renderItem={(entry: ChatReplyRoomEntry) => {
          const fanName = entry.fan?.nickname || t('fanNumber', { id: entry.fanId })
          const isTarget = answerTarget?.replyMessageId === entry.reply.messageId

          return (
            <div className="flex flex-col gap-2">
              {/* Fan reply */}
              <div className="flex justify-start w-full">
                <div className="flex max-w-[80%] flex-row items-end gap-2">
                  <img
                    src={avatarURL(fanName, entry.fan?.imageURL)}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shadow-sm border border-foreground/10 shrink-0"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-zinc-400 mb-1 ml-1 font-medium tracking-tight">{fanName}</span>
                    <div className="flex items-end gap-1.5">
                      {/* Tap to pick this reply as the answer target (toggles) — same grammar as
                          the fan room's tappable bubbles. */}
                      <button
                        type="button"
                        aria-pressed={isTarget}
                        onClick={() =>
                          setAnswerTarget((prev) =>
                            prev?.replyMessageId === entry.reply.messageId
                              ? null
                              : {
                                  fanId: entry.fanId,
                                  replyMessageId: entry.reply.messageId,
                                  fanName,
                                  preview: entry.reply.content.text,
                                },
                          )
                        }
                        className={`text-left px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-zinc-800 text-foreground border transition-colors ${
                          isTarget ? 'border-indigo-400' : 'border-foreground/10'
                        }`}
                      >
                        {entry.reply.content.text}
                      </button>
                      <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
                        {formatTime(entry.reply.createdAt, locale)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Artist's answers */}
              {entry.answers.map((answer) => (
                <div key={answer.messageId} className="flex justify-end w-full">
                  <div className="flex max-w-[80%] items-end gap-1.5 flex-row-reverse">
                    <div className="px-3.5 py-2 rounded-2xl rounded-br-sm shadow-sm text-base leading-relaxed wrap-break-word whitespace-pre-wrap bg-indigo-500 text-white">
                      {answer.content.text}
                    </div>
                    <span className="text-[10px] text-zinc-400 mb-0.5 shrink-0 font-medium">
                      {formatTime(answer.createdAt, locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        }}
        scrollButtonClassName="bottom-[calc(var(--sobok-dock-h)+0.75rem)] right-4"
      />

      {/* Composer island — pick a fan reply to answer, then type here */}
      <ComposerDock
        preview={
          answerTarget && (
            <div className="flex items-center gap-2 p-4 pb-3 pr-3">
              <QuotedMessage
                className="flex-1"
                label={t('answering', { name: answerTarget.fanName })}
                onClick={() => {}}
                preview={answerTarget.preview}
                variant="standalone"
              />
              <button
                type="button"
                onClick={() => setAnswerTarget(null)}
                className="p-1 shrink-0 text-indigo-500 hover:text-indigo-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        }
      >
        <ChatComposer
          onSend={sendAnswer}
          placeholder={answerTarget ? t('answerPlaceholder', { name: answerTarget.fanName }) : t('selectToAnswer')}
          disabled={isAnswering || !answerTarget}
        />
      </ComposerDock>
    </div>
  )
}

// Union fetched entries with realtime ones (deduped by the fan reply's id, fetched wins) and
// splice in optimistic artist answers, sorted oldest→newest.
function mergeEntries(
  fetched: ChatReplyRoomEntry[],
  live: ChatReplyRoomEntry[],
  optimisticAnswers: Record<string, ChatReplyRoomMessage[]>,
): ChatReplyRoomEntry[] {
  const byId = new Map<string, ChatReplyRoomEntry>()

  for (const entry of live) {
    byId.set(entry.reply.messageId, entry)
  }
  for (const entry of fetched) {
    byId.set(entry.reply.messageId, entry)
  }

  return [...byId.values()]
    .map((entry) => {
      const extra = optimisticAnswers[entry.reply.messageId]
      if (!extra) {
        return entry
      }
      const have = new Set(entry.answers.map((answer) => answer.messageId))
      return { ...entry, answers: [...entry.answers, ...extra.filter((answer) => !have.has(answer.messageId))] }
    })
    .sort((a, b) => a.reply.messageId.localeCompare(b.reply.messageId))
}
