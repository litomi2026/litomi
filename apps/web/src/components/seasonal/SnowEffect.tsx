'use client'

import type { CSSProperties } from 'react'

import styles from './SnowEffect.module.css'

type SnowflakeStyle = CSSProperties & {
  '--flake-delay': string
  '--flake-duration': string
  '--flake-left': string
  '--flake-opacity': string
  '--flake-size': string
  '--flake-softness': string
  '--flake-x-end': string
  '--flake-x-early': string
  '--flake-x-mid': string
}

const SNOWFLAKE_COUNT = 64
const SNOWFLAKES = Array.from({ length: SNOWFLAKE_COUNT }, (_, index) => createSnowflake(index))

export default function SnowEffect() {
  return (
    <div aria-hidden className={styles.root}>
      {SNOWFLAKES.map((snowflake, index) => (
        <span className={styles.snowflake} key={index} style={snowflake} />
      ))}
    </div>
  )
}

function createSnowflake(index: number): SnowflakeStyle {
  const lane = (index * 31) % 100
  const drift = -10 + ((index * 17) % 21)
  const size = 4 + ((index * 7) % 9)
  const duration = 14 + ((index * 7) % 16)
  const delay = -((index * 1.9) % duration)
  const opacity = 0.36 + ((index * 11) % 46) / 100
  const softness = 64 + ((index * 13) % 18)

  return {
    '--flake-left': `${Math.min(99, Math.max(1, lane))}vw`,
    '--flake-size': `${size}px`,
    '--flake-duration': `${duration}s`,
    '--flake-delay': `${delay}s`,
    '--flake-opacity': opacity.toFixed(2),
    '--flake-softness': `${softness}%`,
    '--flake-x-early': `${drift * 0.24}vw`,
    '--flake-x-mid': `${drift * 0.62}vw`,
    '--flake-x-end': `${drift}vw`,
  }
}
