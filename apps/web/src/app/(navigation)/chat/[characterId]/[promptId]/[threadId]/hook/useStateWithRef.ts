'use client'

import { useRef, useState } from 'react'

type SetStateAction<T> = T | ((prev: T) => T)

export function useStateWithRef<T>(initial: T | (() => T)) {
  const [state, setState] = useState<T>(initial)
  const ref = useRef(state)

  function set(action: SetStateAction<T>) {
    setState((prev) => {
      const next = typeof action === 'function' ? (action as (p: T) => T)(prev) : action
      ref.current = next
      return next
    })
  }

  return [state, set, ref] as const
}
