'use client'

import { Suspense, useState } from 'react'

import Firework from '@/app/event/newyear/firework/Firework'
import NewYearCountdown from '@/app/event/newyear/NewYearCountdown'

export default function NewYearPage() {
  const [isCountingDown, setIsCountingDown] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)

  function handleCountdownComplete() {
    setHasStarted(true)
  }

  function handleCountingDown(counting: boolean) {
    setIsCountingDown(counting)
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* 불꽃놀이 배경 - 카운트다운 완료 후에만 시작 */}
      {hasStarted && (
        <div className="fixed inset-0 z-0">
          <Firework
            className="h-full w-full"
            config={{
              autoLaunch: true,
              quality: '2',
              finale: true,
              hideControls: false,
              longExposure: false,
              scaleFactor: 1.0,
              shell: 'Random',
              size: '4',
              skyLighting: '2',
              soundEnabled: true,
            }}
          />
        </div>
      )}
      {isCountingDown && !hasStarted && (
        <div className="fixed inset-0 z-0 bg-linear-to-b from-gray-900 via-black to-gray-900" />
      )}
      <Suspense>
        <NewYearCountdown onCountdownComplete={handleCountdownComplete} onCountingDown={handleCountingDown} />
      </Suspense>
    </main>
  )
}
