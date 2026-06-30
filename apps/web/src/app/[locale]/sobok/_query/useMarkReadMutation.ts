import type { PUTV1ChatReadBody } from '@litomi/contracts'
import { useMutation } from '@tanstack/react-query'
import { fetchAPIData } from '@/utils/api-request'

type Params = {
  handle: string
  lastReadMessageId: string
}

export async function markChatRead({ handle, lastReadMessageId }: Params) {
  const url = `/api/v1/chat/artist/${handle}/read`

  await fetchAPIData(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastReadMessageId } satisfies PUTV1ChatReadBody),
  })
}

export default function useMarkReadMutation(handle: string) {
  return useMutation({
    mutationFn: async ({ lastReadMessageId }: { lastReadMessageId: string }) => {
      await markChatRead({ handle, lastReadMessageId })
    },
  })
}
