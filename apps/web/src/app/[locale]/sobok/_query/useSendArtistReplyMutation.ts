import type { POSTV1ArtistReplyBody, POSTV1ArtistReplyResponse } from '@litomi/contracts'
import { useMutation } from '@tanstack/react-query'
import { fetchAPIData } from '@/utils/api-request'

// The artist answers ONE fan's reply (messageId = the broadcast context, fanId = the recipient).
export default function useSendArtistReplyMutation(handle: string, messageId: string) {
  return useMutation({
    mutationFn: async ({ fanId, body }: { fanId: number; body: POSTV1ArtistReplyBody }) => {
      const url = `/api/v1/chat/artist/${handle}/message/${messageId}/reply/${fanId}`

      const { data } = await fetchAPIData<POSTV1ArtistReplyResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      return data
    },
  })
}
