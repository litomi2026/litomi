'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Star, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { saveRating } from '@/app/manga/[id]/actions'
import { QueryKeys } from '@/constants/query'
import useActionResponse from '@/hook/useActionResponse'
import useMeQuery from '@/query/useMeQuery'
import { useUserRatingQuery } from '@/query/useUserRatingQuery'

type Props = {
  mangaId: number
  className?: string
}

export default function RatingInput({ mangaId, className = '' }: Props) {
  const queryClient = useQueryClient()
  const { data: existingRating } = useUserRatingQuery(mangaId)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const { data: me } = useMeQuery()
  const containerRef = useRef<HTMLDivElement>(null)
  const starsRef = useRef<(HTMLButtonElement | null)[]>([])
  const initialPointerPos = useRef<{ x: number; y: number } | null>(null)
  const hasMoved = useRef(false)
  const pointerDownTime = useRef<number>(0)

  useEffect(() => {
    if (existingRating?.rating) {
      setRating(existingRating.rating)
    }
  }, [existingRating])

  const [, dispatchAction, isPending] = useActionResponse({
    action: saveRating,
    onSuccess: (_, [{ rating }]) => {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1000)
      toast.success(`${rating}점으로 평가했어요`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.userRating(mangaId) })
    },
  })

  const handleRating = useCallback(
    (value: number) => {
      if (!me) {
        toast.warning('로그인이 필요해요')
        return
      }

      if (value === rating) {
        return
      }

      setRating(value)
      dispatchAction({ mangaId, rating: value })
    },
    [me, rating, mangaId, dispatchAction],
  )

  const getRatingFromPosition = useCallback((clientX: number) => {
    if (!containerRef.current) {
      return 0
    }

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const width = rect.width
    const starWidth = width / 5
    const starIndex = Math.floor(x / starWidth)

    return Math.max(1, Math.min(5, starIndex + 1))
  }, [])

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    initialPointerPos.current = { x: e.clientX, y: e.clientY }
    hasMoved.current = false
    pointerDownTime.current = Date.now()
    setIsDragging(true)

    const value = getRatingFromPosition(e.clientX)
    setHoveredRating(value)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging || !initialPointerPos.current) {
      return
    }

    const deltaX = Math.abs(e.clientX - initialPointerPos.current.x)
    const deltaY = Math.abs(e.clientY - initialPointerPos.current.y)

    if (deltaX > 3 || deltaY > 3) {
      hasMoved.current = true
    }

    const value = getRatingFromPosition(e.clientX)

    // Only update if value is valid and different
    if (value > 0 && value !== hoveredRating) {
      if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }
      setHoveredRating(value)
    }
  }

  const handlePointerUp = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      if (!isDragging) {
        return
      }

      // Use the hoveredRating if available (when dragging), otherwise calculate from position
      const value = hoveredRating || getRatingFromPosition(e.clientX)
      const timeDiff = Date.now() - pointerDownTime.current

      if (timeDiff < 200 || !hasMoved.current) {
        handleRating(value)
      } else {
        handleRating(value)
      }

      setIsDragging(false)
      setHoveredRating(0)
      initialPointerPos.current = null
      hasMoved.current = false
    },
    [isDragging, hoveredRating, handleRating, getRatingFromPosition],
  )

  function handlePointerLeave() {
    if (isDragging) {
      return
    }

    setHoveredRating(0)
  }

  function handlePointerEnter(e: React.PointerEvent) {
    if (isDragging) {
      const value = getRatingFromPosition(e.clientX)
      if (value > 0) {
        setHoveredRating(value)
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (isPending) {
      return
    }

    let newRating = rating

    if (e.key === 'ArrowLeft') {
      newRating = Math.max(1, rating - 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      newRating = Math.max(1, rating - 1)
    } else if (e.key === 'ArrowRight') {
      newRating = Math.min(5, rating + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      newRating = Math.min(5, rating + 1)
    } else if (e.key >= '1' && e.key <= '5') {
      newRating = parseInt(e.key)
    } else if ((e.key === 'Enter' || e.key === ' ') && rating > 0) {
      e.preventDefault()
      handleRating(rating)
      return
    } else {
      return
    }

    setRating(newRating)
    setHoveredRating(newRating)
    setTimeout(() => setHoveredRating(0), 500)
  }

  function clearRating() {
    setRating(0)
    toast.success('평가를 취소했어요')
    dispatchAction({ mangaId, rating: 0 })
  }

  const displayRating = hoveredRating || rating

  // NOTE: 드래그 중에 컴포넌트 밖에서 포인터가 올라오면 평가를 적용하기 위해
  useEffect(() => {
    if (!isDragging) {
      return
    }

    const handleGlobalPointerUp = (e: PointerEvent) => {
      handlePointerUp(e)
    }

    document.addEventListener('pointerup', handleGlobalPointerUp)

    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp)
    }
  }, [isDragging, handlePointerUp])

  return (
    <div
      className={`flex flex-col items-center justify-center gap-6 overflow-y-auto outline-none ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">작품이 어떠셨나요?</h2>
        <p className="text-zinc-400 text-sm max-w-sm">
          {existingRating?.rating
            ? '별점을 드래그하거나 클릭해서 평가를 수정하세요'
            : '별점을 드래그하거나 클릭해서 평가해주세요'}
        </p>
        <p className="text-zinc-500 text-xs">키보드: ← → 또는 1-5 숫자키</p>
      </div>
      <div
        aria-current={isDragging}
        aria-label="별점 선택"
        aria-valuemax={5}
        aria-valuemin={1}
        aria-valuenow={rating}
        className="flex gap-2 select-none touch-manipulation aria-current:cursor-grabbing cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={containerRef}
        role="slider"
      >
        {[1, 2, 3, 4, 5].map((value, i) => (
          <button
            aria-busy={justSaved && value <= rating}
            aria-label={`${value}점`}
            aria-pressed={value <= displayRating}
            className="transition pointer-events-none aria-pressed:scale-110 aria-busy:animate-[rating-saved_0.5s_ease-in-out]"
            disabled={isPending}
            key={value}
            ref={(el) => {
              starsRef.current[i] = el
            }}
            style={{ animationDelay: value <= rating ? `${i * 50}ms` : undefined }}
            tabIndex={-1}
          >
            <Star
              aria-checked={value <= displayRating}
              aria-current={isDragging && value === displayRating}
              className="size-12 transition text-zinc-600 hover:text-zinc-500 aria-checked:fill-brand-end aria-checked:text-brand-end aria-checked:drop-shadow-lg aria-current:scale-125 aria-current:rotate-12"
            />
          </button>
        ))}
      </div>
      <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-brand-gradient transition-all" style={{ width: `${(displayRating / 5) * 100}%` }} />
      </div>
      <div className="text-center min-h-[4rem]">
        {displayRating > 0 ? (
          <div className="space-y-1 animate-fade-in">
            <div className="text-3xl font-bold text-brand-end">
              {displayRating}.0
              <span className="text-lg ml-2">/ 5.0</span>
            </div>
            <div className="text-sm text-zinc-400">{getRatingText(displayRating)}</div>
          </div>
        ) : (
          <div className="text-zinc-500 text-sm">평가를 선택해주세요</div>
        )}
      </div>
      <div aria-hidden={rating === 0} className="flex gap-4 aria-hidden:opacity-0">
        <button
          className="flex items-center gap-2 text-zinc-500 hover:text-red-400 text-sm transition"
          onClick={clearRating}
        >
          <X className="size-4" />
          평가 취소
        </button>
      </div>
    </div>
  )
}

function getRatingText(rating: number): string {
  switch (rating) {
    case 1:
      return '별로예요 😞'
    case 2:
      return '그저 그래요 😐'
    case 3:
      return '괜찮아요 🙂'
    case 4:
      return '재미있어요 😊'
    case 5:
      return '최고예요 😍'
    default:
      return ''
  }
}
