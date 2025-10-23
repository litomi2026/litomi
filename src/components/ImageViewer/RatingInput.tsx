'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Star, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { GETMangaIdRatingResponse } from '@/app/api/manga/[id]/rating/route'
import { saveRating } from '@/app/manga/[id]/actions'
import { useUserRatingQuery } from '@/components/ImageViewer/useUserRatingQuery'
import { QueryKeys } from '@/constants/query'
import useActionResponse from '@/hook/useActionResponse'
import useMeQuery from '@/query/useMeQuery'

import LoginPageLink from '../LoginPageLink'

type Props = {
  mangaId: number
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

const MIN_RATING = 1
const MAX_RATING = 5
const HORIZONTAL_THRESHOLD = 5
const VERTICAL_THRESHOLD = 10
const DIRECTION_DETERMINATION_THRESHOLD = 15

export default function RatingInput({ mangaId, className = '', onClick }: Props) {
  const queryClient = useQueryClient()
  const { data: existingRating } = useUserRatingQuery(mangaId)
  const { data: me } = useMeQuery()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [justSaved, setJustSaved] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const initialPointerPos = useRef<{ x: number; y: number } | null>(null)
  const gestureDirection = useRef<'horizontal' | 'vertical' | null>(null)
  const displayRating = hoveredRating || rating

  const [, dispatchAction, isPending] = useActionResponse({
    action: saveRating,
    onSuccess: (_, [{ rating }]) => {
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1000)

      if (rating === 0) {
        queryClient.setQueryData<GETMangaIdRatingResponse | null>(QueryKeys.userRating(mangaId), null)
        toast.info('평가를 취소했어요')
      } else {
        const newRating = {
          rating,
          updatedAt: new Date().toISOString(),
        }

        queryClient.setQueryData<GETMangaIdRatingResponse>(QueryKeys.userRating(mangaId), newRating)
        toast.success(`${rating}점으로 평가했어요`)
      }
    },
    shouldSetResponse: false,
  })

  const handleRating = useCallback(
    (value: number, force = false) => {
      if (!me) {
        toast.warning(
          <div className="flex gap-2 items-center">
            <div>로그인이 필요해요</div>
            <LoginPageLink>로그인하기</LoginPageLink>
          </div>,
        )
        return
      }

      if (!force && value === rating) {
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
    const starWidth = width / MAX_RATING
    const starIndex = Math.floor(x / starWidth)

    return Math.max(MIN_RATING, Math.min(starIndex + 1, MAX_RATING))
  }, [])

  function clearPointerState() {
    setHoveredRating(0)
    initialPointerPos.current = null
    gestureDirection.current = null
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    initialPointerPos.current = { x: e.clientX, y: e.clientY }
    gestureDirection.current = null
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!initialPointerPos.current) {
      return
    }

    const deltaX = Math.abs(e.clientX - initialPointerPos.current.x)
    const deltaY = Math.abs(e.clientY - initialPointerPos.current.y)
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (!gestureDirection.current) {
      if (totalMovement >= DIRECTION_DETERMINATION_THRESHOLD) {
        const ratio = deltaX / (deltaY || 1)

        if (ratio > 1.5) {
          gestureDirection.current = 'horizontal'
        } else if (ratio < 0.66) {
          gestureDirection.current = 'vertical'
        } else if (deltaY > VERTICAL_THRESHOLD) {
          gestureDirection.current = 'vertical'
        } else if (deltaX > HORIZONTAL_THRESHOLD) {
          gestureDirection.current = 'horizontal'
        }
      }
    }

    if (gestureDirection.current === 'vertical') {
      clearPointerState()
      return
    }

    if (gestureDirection.current === 'horizontal' || (!gestureDirection.current && deltaX > HORIZONTAL_THRESHOLD)) {
      e.preventDefault()
      const value = getRatingFromPosition(e.clientX)

      if (value > 0 && value !== hoveredRating) {
        if ('vibrate' in navigator) {
          navigator.vibrate(10)
        }
        setHoveredRating(value)
      }
    }
  }

  const handlePointerUp = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      e.stopPropagation()

      if (!initialPointerPos.current) {
        return
      }

      if (gestureDirection.current === 'horizontal' || !gestureDirection.current) {
        handleRating(hoveredRating || getRatingFromPosition(e.clientX))
      }

      clearPointerState()
    },
    [hoveredRating, handleRating, getRatingFromPosition],
  )

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
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (rating > 0) {
        handleRating(rating, true)
      }
      return
    } else {
      return
    }

    setRating(newRating)
    setHoveredRating(newRating)
    setTimeout(() => setHoveredRating(0), 500)
  }

  function handleCancelClick(e: React.MouseEvent) {
    e.stopPropagation()
    handleRating(0)
  }

  // NOTE: 드래그 중에 컴포넌트 밖에서 포인터가 올라오면 평가를 적용하기 위해
  useEffect(() => {
    if (!initialPointerPos.current) {
      return
    }

    document.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [handlePointerUp])

  // NOTE: 기존 평가가 있으면 표시함
  useEffect(() => {
    if (existingRating?.rating) {
      setRating(existingRating.rating)
    }
  }, [existingRating])

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`} onClick={onClick}>
      <div className="grid gap-2 text-center">
        <h2 className="text-xl font-semibold text-foreground">작품이 어떠셨나요?</h2>
        <p className="text-zinc-400 text-sm max-w-sm mx-auto">
          별점을 드래그하거나 클릭해서 {existingRating?.rating ? '수정' : '평가'}해주세요
        </p>
      </div>
      <div
        aria-current={hoveredRating > 0}
        aria-label="별점 선택"
        aria-valuemax={MAX_RATING}
        aria-valuemin={MIN_RATING}
        aria-valuenow={rating}
        className="flex gap-1 sm:gap-2 select-none cursor-pointer outline-none touch-pan-y aria-current:cursor-grabbing py-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={containerRef}
        role="slider"
        tabIndex={0}
      >
        {[1, 2, 3, 4, 5].map((value, i) => (
          <button
            aria-busy={justSaved && value <= rating}
            aria-current={value <= displayRating}
            aria-label={`${value}점`}
            className="transition pointer-events-none aria-current:scale-110 aria-busy:animate-[rating-saved_0.5s_ease-in-out] p-1"
            disabled={isPending}
            key={value}
            style={{ animationDelay: `${i * 50}ms` }}
            tabIndex={-1}
          >
            <Star
              aria-current={value <= displayRating}
              aria-pressed={hoveredRating > 0 && value === displayRating}
              className="size-10 sm:size-12 transition text-zinc-600 aria-current:fill-brand-end aria-current:text-brand-end aria-pressed:scale-125 aria-pressed:rotate-12"
            />
          </button>
        ))}
      </div>
      <div className="text-center">
        <div className="grid gap-1 min-h-[4rem]">
          <div
            aria-current={displayRating > 0}
            className="text-2xl sm:text-3xl font-bold text-zinc-500 aria-current:text-brand-end transition"
          >
            {displayRating}.0
            <span className="text-base sm:text-lg ml-2 text-zinc-400">/ 5.0</span>
          </div>
          {displayRating > 0 && <div className="text-sm text-zinc-400">{getRatingText(displayRating)}</div>}
        </div>
      </div>
      <div
        aria-hidden={rating === 0}
        className="flex gap-4 transition aria-hidden:opacity-0 aria-hidden:pointer-events-none"
      >
        <button
          className="flex items-center gap-2 text-zinc-500 hover:text-red-400 rounded-full text-sm transition p-3 py-2 -m-2 hover:bg-red-400/10"
          onClick={handleCancelClick}
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
      return '아쉬워요 😐'
    case 3:
      return '괜찮아요 🙂'
    case 4:
      return '재밌어요 😊'
    case 5:
      return '최고예요 😍'
    default:
      return ''
  }
}
