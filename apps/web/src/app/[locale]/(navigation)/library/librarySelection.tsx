'use client'

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

type LibrarySelectionActions = {
  clear: () => void
  enter: () => void
  exit: () => void
  toggle: (mangaId: number) => void
}

type LibrarySelectionContextValue = LibrarySelectionActions & LibrarySelectionState

type LibrarySelectionState = {
  isSelectionMode: boolean
  scopeKey: string
  selectedCount: number
  selectedIds: Set<number>
}

const LibrarySelectionContext = createContext<LibrarySelectionContextValue | null>(null)

type Props = {
  children: ReactNode
  scopeKey: string
}

export function LibrarySelectionProvider({ children, scopeKey }: Props) {
  const [state, setState] = useState<LibrarySelectionState>(() => createLibrarySelectionState(scopeKey))

  const [actions] = useState<LibrarySelectionActions>(() => ({
    clear: () => {
      setState(clearLibrarySelection)
    },
    enter: () => {
      setState(enterLibrarySelection)
    },
    exit: () => {
      setState(exitLibrarySelection)
    },
    toggle: (mangaId: number) => {
      setState((current) => toggleLibrarySelection(current, mangaId))
    },
  }))

  useEffect(() => {
    setState((current) => {
      if (current.scopeKey === scopeKey) {
        return current
      }

      return createLibrarySelectionState(scopeKey)
    })
  }, [scopeKey])

  return (
    <LibrarySelectionContext.Provider value={{ ...actions, ...state }}>{children}</LibrarySelectionContext.Provider>
  )
}

export function useLibrarySelection(): LibrarySelectionContextValue {
  const context = useContext(LibrarySelectionContext)

  if (!context) {
    throw new Error('useLibrarySelection must be used within LibrarySelectionProvider')
  }

  return context
}

function clearLibrarySelection(state: LibrarySelectionState): LibrarySelectionState {
  if (state.selectedCount === 0) {
    return state
  }

  return {
    ...state,
    selectedCount: 0,
    selectedIds: new Set(),
  }
}

function createLibrarySelectionState(scopeKey: string): LibrarySelectionState {
  return {
    isSelectionMode: false,
    scopeKey,
    selectedCount: 0,
    selectedIds: new Set(),
  }
}

function enterLibrarySelection(state: LibrarySelectionState): LibrarySelectionState {
  if (state.isSelectionMode) {
    return state
  }

  return {
    ...state,
    isSelectionMode: true,
  }
}

function exitLibrarySelection(state: LibrarySelectionState): LibrarySelectionState {
  if (!state.isSelectionMode && state.selectedCount === 0) {
    return state
  }

  return {
    ...state,
    isSelectionMode: false,
    selectedCount: 0,
    selectedIds: new Set(),
  }
}

function toggleLibrarySelection(state: LibrarySelectionState, mangaId: number): LibrarySelectionState {
  const selectedIds = new Set(state.selectedIds)

  if (selectedIds.has(mangaId)) {
    selectedIds.delete(mangaId)
  } else {
    selectedIds.add(mangaId)
  }

  return {
    ...state,
    selectedCount: selectedIds.size,
    selectedIds,
  }
}
