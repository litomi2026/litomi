import { useEffect, useState } from 'react'

import { FireworkEngine } from './FireworkEngine'

type Props = {
  engineRef: React.RefObject<FireworkEngine | null>
  isLoading: boolean
}

export default function PauseButton({ engineRef, isLoading }: Props) {
  const [isPaused, setIsPaused] = useState(false)

  function handleTogglePause() {
    if (engineRef.current) {
      engineRef.current.togglePause()
    }
  }

  useEffect(() => {
    if (!isLoading && engineRef.current) {
      engineRef.current.onPauseToggle = setIsPaused
    }
  }, [isLoading, engineRef])

  return (
    <button
      aria-label={isPaused ? 'Play' : 'Pause'}
      className="flex h-[50px] w-[50px] cursor-default select-none opacity-[0.16] transition-opacity duration-300 hover:opacity-[0.32]"
      onClick={handleTogglePause}
      type="button"
    >
      <svg className="m-auto" fill="white" height="24" width="24">
        {isPaused ? <path d="M8 5v14l11-7z" /> : <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />}
      </svg>
    </button>
  )
}
