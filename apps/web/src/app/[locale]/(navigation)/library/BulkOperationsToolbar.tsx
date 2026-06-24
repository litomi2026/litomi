'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import BulkDeleteDialog from './BulkDeleteDialog'
import BulkLibrarySelectDialog from './BulkLibrarySelectDialog'
import type { BulkActionDescriptor } from './bulkActionTypes'
import { useLibrarySelection } from './librarySelection'

const ACTION_BUTTON_CLASS_NAME =
  'flex items-center gap-2 p-3 py-1.5 rounded-lg transition disabled:opacity-50 data-[tone=danger]:bg-red-900/50 data-[tone=danger]:hover:bg-red-900/70 data-[tone=danger]:text-red-400 data-[tone=default]:bg-zinc-800 data-[tone=default]:hover:bg-zinc-700'

type Props = {
  actions: BulkActionDescriptor[]
}

export default function BulkOperationsToolbar({ actions }: Props) {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const { selectedCount } = useLibrarySelection()
  const t = useTranslations('Library.common')

  const isAnyPending = actions.some((action) => action.pending)
  const activeAction = actions.find((action) => action.id === activeActionId) ?? null

  function closeDialog() {
    if (!isAnyPending) {
      setActiveActionId(null)
    }
  }

  function getDisabledReason(actionDisabledReason?: string) {
    if (selectedCount === 0) {
      return t('selectWorks')
    }

    if (isAnyPending) {
      return t('processing')
    }

    return actionDisabledReason ?? ''
  }

  return (
    <>
      <div className="flex-1 flex items-center justify-between gap-2">
        <span className="py-2.5 text-sm sm:text-base font-medium">{t('selectedCount', { count: selectedCount })}</span>
        <div className="flex items-center gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            const disabledReason = getDisabledReason(action.disabledReason)

            return (
              <button
                className={ACTION_BUTTON_CLASS_NAME}
                data-tone={action.tone ?? 'default'}
                disabled={disabledReason !== ''}
                key={action.id}
                onClick={() => setActiveActionId(action.id)}
                title={disabledReason}
                type="button"
              >
                <Icon className="size-5" />
                <span className="hidden sm:block">{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      {activeAction?.type === 'library-select' && (
        <BulkLibrarySelectDialog
          ariaLabel={activeAction.dialogTitle}
          description={activeAction.dialogDescription}
          emptyMessage={activeAction.emptyMessage}
          isPending={Boolean(activeAction.pending)}
          libraries={activeAction.libraries}
          onClose={closeDialog}
          onSelectLibrary={activeAction.onSelectLibrary}
          open
          title={activeAction.dialogTitle}
        />
      )}
      {activeAction?.type === 'confirm' && (
        <BulkDeleteDialog
          ariaLabel={activeAction.ariaLabel}
          confirmLabel={activeAction.confirmLabel}
          description={activeAction.description}
          isPending={Boolean(activeAction.pending)}
          onClose={closeDialog}
          onConfirm={activeAction.onConfirm}
          open
          title={activeAction.title}
          warning={activeAction.warning}
        />
      )}
    </>
  )
}
