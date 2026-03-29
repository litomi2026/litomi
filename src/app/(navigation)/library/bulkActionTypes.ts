import type { LucideIcon } from 'lucide-react'

export type BulkActionDescriptor = BulkConfirmActionDescriptor | BulkLibrarySelectActionDescriptor

export type BulkConfirmActionDescriptor = BulkActionBase & {
  ariaLabel: string
  confirmLabel: string
  description: string
  onConfirm: () => void
  title: string
  type: 'confirm'
  warning: string
}

export type BulkLibrarySelectActionDescriptor = BulkActionBase & {
  dialogDescription: string
  dialogTitle: string
  emptyMessage: string
  libraries: BulkTargetLibrary[]
  onSelectLibrary: (libraryId: number) => void
  type: 'library-select'
}

export type BulkTargetLibrary = {
  color: string | null
  icon: string | null
  id: number
  itemCount: number
  name: string
}

type BulkActionBase = {
  disabledReason?: string
  icon: LucideIcon
  id: string
  label: string
  pending?: boolean
  tone?: 'danger' | 'default'
}
