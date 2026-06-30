import type { PUTV1ChatReadBody } from '@litomi/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

type Params = {
  handle: string
  messageId: string
  lastReadMessageId: string
}

export async function markChatMessageRead({ handle, messageId, lastReadMessageId }: Params) {
  const url = `/api/v1/chat/artist/${handle}/message/${messageId}/read`

  await fetchAPIData(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastReadMessageId } satisfies PUTV1ChatReadBody),
  })
}

export default function useMarkMessageReadMutation(handle: string, messageId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lastReadMessageId }: { lastReadMessageId: string }) => {
      await markChatMessageRead({ handle, messageId, lastReadMessageId })
    },
    // Synchronous server write (the cursor is persisted before the 204), so refetching the
    // studio timeline now reliably reflects the now-zero unread count for this message.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatMessages(handle) })
    },
  })
}
