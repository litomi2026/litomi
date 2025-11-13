'use client'

import ms from 'ms'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface NewYearCountdownProps {
  onCountdownComplete?: () => void
  onCountingDown?: (isCountingDown: boolean) => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function NewYearCountdown({ onCountdownComplete, onCountingDown }: NewYearCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [isNewYear, setIsNewYear] = useState(false)
  const [showCountdown, setShowCountdown] = useState(false)
  const [hasTriggeredComplete, setHasTriggeredComplete] = useState(false)
  const searchParams = useSearchParams()
  const dday = Number(searchParams.get('dday') ?? 0) * 1000

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft | null => {
      const now = new Date()
      const currentYear = now.getFullYear()
      const newYear = dday ? new Date(dday) : new Date(currentYear + 1, 0, 1, 0, 0, 0)
      const difference = newYear.getTime() - now.getTime()

      if (difference > ms('7 days')) {
        setShowCountdown(false)
        onCountingDown?.(false)
        return null
      }

      setShowCountdown(true)

      if (difference <= 0) {
        // 새해가 되면 불꽃놀이 시작 트리거
        if (!hasTriggeredComplete) {
          setHasTriggeredComplete(true)
          onCountdownComplete?.()
        }

        // 새해가 되면 5분간 축하 메시지 표시
        if (Math.abs(difference) < ms('5 minutes')) {
          setIsNewYear(true)
          onCountingDown?.(false)
        } else {
          setShowCountdown(false)
          onCountingDown?.(false)
        }
        return null
      }

      // 카운트다운 진행 중
      onCountingDown?.(true)

      return {
        days: Math.floor(difference / ms('1 day')),
        hours: Math.floor((difference / ms('1 hour')) % 24),
        minutes: Math.floor((difference / ms('1 minute')) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    const timer = setInterval(() => {
      const time = calculateTimeLeft()
      setTimeLeft(time)
    }, 1000)

    // 초기 계산
    const time = calculateTimeLeft()
    setTimeLeft(time)

    return () => clearInterval(timer)
  }, [dday, hasTriggeredComplete, onCountdownComplete, onCountingDown])

  if (!showCountdown) {
    return null
  }

  if (isNewYear) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div className="text-center animate-pulse">
          <div className="font-['Russo_One',arial,sans-serif] text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]">
            🎉 Happy New Year! 🎊
          </div>
          <div className="font-['Russo_One',arial,sans-serif] text-3xl md:text-5xl lg:text-6xl font-bold text-white/90 mt-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
            {new Date().getFullYear()}
          </div>
        </div>
      </div>
    )
  }

  if (!timeLeft) {
    return null
  }

  return (
    <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-20">
      <div className="text-center">
        <div className="font-['Russo_One',arial,sans-serif] text-2xl md:text-3xl lg:text-4xl font-bold text-white/80 mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
          새해 카운트다운
        </div>
        <div className="flex gap-4 justify-center">
          {timeLeft.days > 0 && (
            <div className="flex flex-col items-center min-w-[80px] md:min-w-[100px]">
              <div className="font-['Russo_One',arial,sans-serif] text-5xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                {timeLeft.days}
              </div>
              <div className="font-['Russo_One',arial,sans-serif] text-lg md:text-xl lg:text-2xl text-white/70 mt-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                일
              </div>
            </div>
          )}
          <div className="flex flex-col items-center min-w-[80px] md:min-w-[100px]">
            <div className="font-['Russo_One',arial,sans-serif] text-5xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div className="font-['Russo_One',arial,sans-serif] text-lg md:text-xl lg:text-2xl text-white/70 mt-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              시간
            </div>
          </div>
          <div className="flex flex-col items-center min-w-[80px] md:min-w-[100px]">
            <div className="font-['Russo_One',arial,sans-serif] text-5xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div className="font-['Russo_One',arial,sans-serif] text-lg md:text-xl lg:text-2xl text-white/70 mt-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              분
            </div>
          </div>
          <div className="flex flex-col items-center min-w-[80px] md:min-w-[100px]">
            <div className="font-['Russo_One',arial,sans-serif] text-5xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div className="font-['Russo_One',arial,sans-serif] text-lg md:text-xl lg:text-2xl text-white/70 mt-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              초
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
