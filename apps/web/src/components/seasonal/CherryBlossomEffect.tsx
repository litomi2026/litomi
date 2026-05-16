'use client'

import type { CSSProperties } from 'react'

import styles from './CherryBlossomEffect.module.css'

type PetalStyle = CSSProperties & {
  '--petal-delay': string
  '--petal-duration': string
  '--petal-height': string
  '--petal-left': string
  '--petal-opacity': string
  '--petal-rotate-early': string
  '--petal-rotate-end': string
  '--petal-rotate-mid': string
  '--petal-size': string
  '--petal-x-early': string
  '--petal-x-end': string
  '--petal-x-mid': string
}

const PETAL_COUNT = 30
const PETALS = Array.from({ length: PETAL_COUNT }, (_, index) => createPetal(index))

export default function CherryBlossomEffect() {
  return (
    <div aria-hidden className={styles.root}>
      {PETALS.map((petal, index) => (
        <span className={styles.petal} key={index} style={petal} />
      ))}
    </div>
  )
}

function createPetal(index: number): PetalStyle {
  const lane = (index * 37) % 100
  const wave = Math.sin(index * 2.17)
  const drift = -12 + ((index * 29) % 25)
  const sway = 3 + ((index * 7) % 6)
  const spin = 180 + ((index * 47) % 360)
  const size = 9 + ((index * 5) % 9)
  const duration = 14 + ((index * 3) % 9)
  const delay = -((index * 2.1) % duration)
  const opacity = 0.4 + ((index * 13) % 30) / 100

  return {
    '--petal-left': `${Math.min(98, Math.max(2, lane + wave * 4))}vw`,
    '--petal-size': `${size}px`,
    '--petal-height': `${size * 0.72}px`,
    '--petal-duration': `${duration}s`,
    '--petal-delay': `${delay}s`,
    '--petal-opacity': opacity.toFixed(2),
    '--petal-x-early': `${drift * 0.28 + sway}vw`,
    '--petal-x-mid': `${drift * 0.62 - sway}vw`,
    '--petal-x-end': `${drift}vw`,
    '--petal-rotate-early': `${spin * 0.28}deg`,
    '--petal-rotate-mid': `${spin * 0.62}deg`,
    '--petal-rotate-end': `${spin}deg`,
  }
}
