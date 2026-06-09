import { useState } from 'react'

const INITIAL_SELECTED_INDEX = -1

type Props = {
  isOpen: boolean
  itemCount: number
  listboxId: string
}

export default function useSuggestionSelection({ isOpen, itemCount, listboxId }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(INITIAL_SELECTED_INDEX)

  const activeDescendantId =
    isOpen && selectedIndex >= 0 && selectedIndex < itemCount ? `${listboxId}-option-${selectedIndex}` : undefined

  function resetSelection() {
    setSelectedIndex(INITIAL_SELECTED_INDEX)
  }

  function navigateSelection(direction: 'down' | 'up') {
    if (itemCount === 0) {
      return
    }

    setSelectedIndex((prev) => {
      if (prev < 0 || prev >= itemCount) {
        return direction === 'down' ? 0 : itemCount - 1
      }

      if (direction === 'down') {
        return prev < itemCount - 1 ? prev + 1 : 0
      }

      return prev > 0 ? prev - 1 : itemCount - 1
    })
  }

  return {
    activeDescendantId,
    navigateSelection,
    resetSelection,
    selectedIndex,
  }
}
