import type { POSTV1ArtistReplyBody, POSTV1ArtistReplyResponse } from '@litomi/contracts'
import { useMutation } from '@tanstack/react-query'
import { fetchAPIData } from '@/utils/api-request'

type Params = {
  handle: string
  messageId: string
  fanId: number
  body: POSTV1ArtistReplyBody
}

export async function sendArtistReply({ handle, messageId, fanId, body }: Params) {
  const url = `/api/v1/chat/artist/${handle}/message/${messageId}/reply/${fanId}`

  const { data } = await fetchAPIData<POSTV1ArtistReplyResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

// The artist answers ONE fan's reply (messageId = the broadcast context, fanId = the recipient).
export default function useSendArtistReplyMutation(handle: string, messageId: string) {
  return useMutation({
    mutationFn: async ({ fanId, body }: { fanId: number; body: POSTV1ArtistReplyBody }) =>
      sendArtistReply({ handle, messageId, fanId, body }),
  })
}
