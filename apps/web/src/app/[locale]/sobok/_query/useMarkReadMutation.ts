import type { PUTV1ChatReadBody } from '@litomi/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export default function useMarkReadMutation(handle: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lastReadMessageId }: { lastReadMessageId: string }) => {
      await fetchAPIData(`/api/v1/chat/artist/${handle}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReadMessageId } satisfies PUTV1ChatReadBody),
      })
    },
    // The fan's broadcast watermark drives the chat-list unread badge — refetch it so the
    // badge clears immediately instead of waiting for the next focus/refresh.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.chatThreads })
    },
  })
}
