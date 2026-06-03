'use client'

import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { QueryKeys } from '@/lib/react-query/query-keys'

import { deleteNotifications, markNotificationsAsRead } from './api'
import { useNotificationSelection } from './NotificationProvider'

const MARK_AS_READ_MUTATION_KEY = ['notification', 'mark-as-read'] as const
const DELETE_MUTATION_KEY = ['notification', 'delete'] as const

export default function useNotificationActions() {
  const t = useTranslations('Community.notification')
  const queryClient = useQueryClient()
  const { cancelSelection, selectedIds } = useNotificationSelection()

  function handleMutationSuccess() {
    cancelSelection()
    const searchParams = new URLSearchParams(window.location.search)
    queryClient.invalidateQueries({ queryKey: QueryKeys.notifications(searchParams) })
    queryClient.invalidateQueries({ queryKey: QueryKeys.notificationUnreadCount })
  }

  const { mutate: requestMarkAsRead } = useMutation({
    mutationFn: markNotificationsAsRead,
    mutationKey: MARK_AS_READ_MUTATION_KEY,
    onSuccess: handleMutationSuccess,
  })

  const { mutate: requestDeleteNotifications } = useMutation({
    mutationFn: deleteNotifications,
    mutationKey: DELETE_MUTATION_KEY,
    onSuccess: () => {
      toast.success(t('actions.deletedToast'))
      handleMutationSuccess()
    },
  })

  const isMarkAsReadPending = useIsMutating({ mutationKey: MARK_AS_READ_MUTATION_KEY }) > 0
  const isDeleteNotificationsPending = useIsMutating({ mutationKey: DELETE_MUTATION_KEY }) > 0

  function markNowAsRead(ids: number[]) {
    if (ids.length > 0) {
      requestMarkAsRead({ ids })
    }
  }

  function deleteNotification(id: number) {
    requestDeleteNotifications({ ids: [id] })
  }

  function runBatchAction(action: 'delete' | 'read') {
    const ids = Array.from(selectedIds)

    if (ids.length === 0) {
      return
    }

    if (action === 'read') {
      requestMarkAsRead({ ids })
    } else {
      requestDeleteNotifications({ ids })
    }
  }

  return {
    deleteNotification,
    isActionPending: isMarkAsReadPending || isDeleteNotificationsPending,
    isDeleteNotificationsPending,
    isMarkAsReadPending,
    markNowAsRead,
    runBatchAction,
  }
}
