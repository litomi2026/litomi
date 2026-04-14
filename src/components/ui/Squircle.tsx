'use client'

import { useEffect, useId, useState } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  children?: string
  textClassName?: string
  backgroundClassName?: string
  fill?: string
  src?: string | null
  className?: string
}

export default function Squircle({
  src,
  fill,
  children,
  className = '',
  textClassName = '',
  backgroundClassName = '',
}: Props) {
  const [hasImageError, setHasImageError] = useState(false)
  const shapeId = useId()
  const clipPathId = useId()

  const fallbackText = children?.trim() ?? ''
  const fallbackFontSize = Array.from(fallbackText).length > 1 ? 40 : 48

  useEffect(() => {
    setHasImageError(false)
  }, [src])

  return (
    <svg className={twMerge('block', className)} viewBox="0 0 88 88">
      <defs>
        <path
          d="M44,0 C76.0948147,0 88,11.9051853 88,44 C88,76.0948147 76.0948147,88 44,88 C11.9051853,88 0,76.0948147 0,44 C0,11.9051853 11.9051853,0 44,0 Z"
          id={shapeId}
        />
        <clipPath id={clipPathId}>
          <use href={`#${shapeId}`} />
        </clipPath>
      </defs>
      <use
        className={twMerge('fill-zinc-700', backgroundClassName)}
        href={`#${shapeId}`}
        style={fill ? { fill } : undefined}
      />
      {src && !hasImageError ? (
        <image
          clipPath={`url(#${clipPathId})`}
          height="100%"
          href={src}
          onError={() => setHasImageError(true)}
          preserveAspectRatio="xMidYMid slice"
          width="100%"
        />
      ) : (
        <text
          className={twMerge('fill-current', textClassName)}
          dominantBaseline="middle"
          fontSize={fallbackFontSize}
          fontWeight="600"
          textAnchor="middle"
          x="50%"
          y="55%"
        >
          {fallbackText}
        </text>
      )}
      <use fill="none" href={`#${shapeId}`} stroke="rgba(0, 0, 0, 0.08)" strokeWidth="1" />
    </svg>
  )
}
