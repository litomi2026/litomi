'use client'

import { type ReactNode, useEffect } from 'react'

type Props = {
  children: ReactNode
  withAltKey?: boolean
  keyCode: string
  onKeyDown?: () => void
}

export default function KeybordShortcut({ withAltKey, children, keyCode, onKeyDown }: Readonly<Props>) {
  useEffect(() => {
    function downHandler({ code, altKey }: KeyboardEvent) {
      if ((!withAltKey || altKey) && keyCode === code) {
        onKeyDown?.()
      }
    }

    document.addEventListener('keydown', downHandler)

    return () => {
      document.removeEventListener('keydown', downHandler)
    }
  }, [keyCode, onKeyDown, withAltKey])

  return <>{children}</>
}
