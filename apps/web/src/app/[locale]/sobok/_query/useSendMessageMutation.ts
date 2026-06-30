import type { POSTV1ChatMessageBody, POSTV1ChatMessageResponse } from '@litomi/contracts'
import { useMutation } from '@tanstack/react-query'
import { fetchAPIData } from '@/utils/api-request'

type Params = {
  handle: string
  body: POSTV1ChatMessageBody
}

export async function sendChatMessage({ handle, body }: Params) {
  const url = `/api/v1/chat/artist/${handle}/message`

  const { data } = await fetchAPIData<POSTV1ChatMessageResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return data
}

export default function useSendMessageMutation(handle: string) {
  return useMutation({
    mutationFn: async (body: POSTV1ChatMessageBody) => {
      return sendChatMessage({ handle, body })
    },
  })
}
