import type { PUTV1ChatReadBody } from '@litomi/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lastReadMessageId }: { lastReadMessageId: string }) => {
      await markChatRead({ handle, lastReadMessageId })
    },
    // The fan's broadcast watermark drives the chat-list unread badge — refetch it so the
    // badge clears immediately instead of waiting for the next focus/refresh.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatThreads })
    },
  })
}
