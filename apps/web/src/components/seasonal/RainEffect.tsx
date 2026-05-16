'use client'

import type { CSSProperties } from 'react'

import styles from './RainEffect.module.css'

type DropStyle = CSSProperties & {
  '--drop-delay': string
  '--drop-duration': string
  '--drop-left': string
  '--drop-opacity': string
  '--drop-size': string
  '--drop-x-end': string
}

const DROP_COUNT = 64
const DROPS = Array.from({ length: DROP_COUNT }, (_, index) => createDrop(index))

export default function RainEffect() {
  return (
    <div aria-hidden className={styles.root}>
      {DROPS.map((drop, index) => (
        <span className={styles.drop} key={index} style={drop} />
      ))}
    </div>
  )
}

function createDrop(index: number): DropStyle {
  const lane = (index * 23) % 100
  const duration = 0.78 + ((index * 7) % 14) / 100
  const delay = -((index * 0.13) % duration)
  const length = 34 + ((index * 5) % 24)
  const opacity = 0.34 + ((index * 7) % 24) / 100

  return {
    '--drop-left': `${Math.min(99, Math.max(1, lane))}vw`,
    '--drop-size': `${length}px`,
    '--drop-duration': `${duration.toFixed(2)}s`,
    '--drop-delay': `${delay.toFixed(2)}s`,
    '--drop-opacity': opacity.toFixed(2),
    '--drop-x-end': `${-18 - ((index * 3) % 10)}vw`,
  }
}
