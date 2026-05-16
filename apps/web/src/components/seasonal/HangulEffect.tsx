'use client'

import type { CSSProperties } from 'react'

import styles from './HangulEffect.module.css'

type Glyph = {
  character: string
  style: GlyphStyle
}

type GlyphStyle = CSSProperties & {
  '--glyph-delay': string
  '--glyph-duration': string
  '--glyph-left': string
  '--glyph-opacity': string
  '--glyph-rotate-end': string
  '--glyph-rotate-mid': string
  '--glyph-size': string
  '--glyph-top': string
  '--glyph-x-end': string
  '--glyph-x-mid': string
  '--glyph-y-end': string
  '--glyph-y-mid': string
}

const JAMO = [
  'ㄱ',
  'ㄴ',
  'ㄷ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅅ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
  'ㅏ',
  'ㅓ',
  'ㅗ',
  'ㅜ',
  'ㅡ',
  'ㅣ',
  'ㆍ',
  'ㆎ',
  'ㅿ',
  'ㆁ',
  'ㆆ',
  'ㆅ',
  'ㆀ',
]

const GLYPHS = Array.from({ length: JAMO.length }, (_, index) => createGlyph(index))

export default function HangulEffect() {
  return (
    <div aria-hidden className={styles.root}>
      <span className={styles.watermark} />
      {GLYPHS.map((glyph, index) => (
        <span className={styles.glyph} key={index} style={glyph.style}>
          {glyph.character}
        </span>
      ))}
    </div>
  )
}

function createGlyph(index: number): Glyph {
  const lane = (index * 37) % 100
  const row = 8 + ((index * 29) % 82)
  const drift = -8 + ((index * 17) % 17)
  const lift = -10 - ((index * 11) % 12)
  const spin = -10 + ((index * 7) % 21)
  const size = 18 + ((index * 5) % 13)
  const duration = 18 + ((index * 3) % 14)
  const delay = -((index * 2.3) % duration)
  const opacity = 0.12 + ((index * 11) % 16) / 100

  return {
    character: JAMO[index % JAMO.length]!,
    style: {
      '--glyph-left': `${Math.min(96, Math.max(3, lane))}vw`,
      '--glyph-top': `${row}vh`,
      '--glyph-size': `${size}px`,
      '--glyph-duration': `${duration}s`,
      '--glyph-delay': `${delay}s`,
      '--glyph-opacity': opacity.toFixed(2),
      '--glyph-x-mid': `${drift * 0.55}vw`,
      '--glyph-y-mid': `${lift * 0.45}vh`,
      '--glyph-x-end': `${drift}vw`,
      '--glyph-y-end': `${lift}vh`,
      '--glyph-rotate-mid': `${spin * 0.45}deg`,
      '--glyph-rotate-end': `${spin}deg`,
    },
  }
}
