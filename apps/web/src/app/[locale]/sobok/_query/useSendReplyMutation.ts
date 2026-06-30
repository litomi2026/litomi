import type { POSTV1ChatReplyBody, POSTV1ChatReplyResponse } from '@litomi/contracts'
import { useMutation } from '@tanstack/react-query'
import { fetchAPIData } from '@/utils/api-request'

type Params = {
  handle: string
  messageId: string
  body: POSTV1ChatReplyBody
}

export async function sendChatReply({ handle, messageId, body }: Params) {
  const url = `/api/v1/chat/artist/${handle}/message/${messageId}/reply`

  const { data } = await fetchAPIData<POSTV1ChatReplyResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export default function useSendReplyMutation(handle: string) {
  return useMutation({
    mutationFn: async ({ messageId, body }: { messageId: string; body: POSTV1ChatReplyBody }) => {
      return sendChatReply({ handle, messageId, body })
    },
  })
}
