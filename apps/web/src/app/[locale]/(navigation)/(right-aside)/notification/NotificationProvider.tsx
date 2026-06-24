'use client'

import { createContext, type ReactNode, useContext, useState } from 'react'

interface NotificationSelectionContextValue {
  cancelSelection: () => void
  selectedIds: Set<number>
  selectionMode: boolean
  startSelection: () => void
  toggleSelection: (id: number) => void
}

const NotificationSelectionContext = createContext<NotificationSelectionContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  function startSelection() {
    setSelectionMode(true)
  }

  function cancelSelection() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function toggleSelection(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  const value = {
    selectedIds,
    selectionMode,
    startSelection,
    toggleSelection,
    cancelSelection,
  }

  return <NotificationSelectionContext.Provider value={value}>{children}</NotificationSelectionContext.Provider>
}

export function useNotificationSelection() {
  const context = useContext(NotificationSelectionContext)

  if (!context) {
    throw new Error('useNotificationSelection must be used within NotificationProvider')
  }

  return context
}
