'use client'

import type { CSSProperties } from 'react'

import styles from './HalloweenEffect.module.css'

type BatStyle = CSSProperties & {
  '--bat-delay': string
  '--bat-duration': string
  '--bat-opacity': string
  '--bat-rotate-end': string
  '--bat-rotate-mid': string
  '--bat-size': string
  '--bat-top': string
  '--bat-x-end': string
  '--bat-x-mid': string
  '--bat-y-end': string
  '--bat-y-mid': string
}

type GhostStyle = CSSProperties & {
  '--ghost-delay': string
  '--ghost-duration': string
  '--ghost-left': string
  '--ghost-opacity': string
  '--ghost-rotate-end': string
  '--ghost-rotate-mid': string
  '--ghost-size': string
  '--ghost-top': string
  '--ghost-x-end': string
  '--ghost-x-mid': string
  '--ghost-y-end': string
  '--ghost-y-mid': string
}

const BAT_COUNT = 4
const GHOST_COUNT = 6
const BATS = Array.from({ length: BAT_COUNT }, (_, index) => createBat(index))
const GHOSTS = Array.from({ length: GHOST_COUNT }, (_, index) => createGhost(index))

export default function HalloweenEffect() {
  return (
    <div aria-hidden className={styles.root}>
      <div className={styles.batLayer}>
        {BATS.map((bat, index) => (
          <span className={styles.bat} key={index} style={bat}>
            <span className={styles.batShape} />
          </span>
        ))}
      </div>
      <div className={styles.ghostLayer}>
        {GHOSTS.map((ghost, index) => (
          <span className={styles.ghost} key={index} style={ghost} />
        ))}
      </div>
    </div>
  )
}

function createBat(index: number): BatStyle {
  const top = 7 + ((index * 11) % 20)
  const size = 48 + ((index * 13) % 28)
  const duration = 28 + ((index * 7) % 17)
  const delay = -((index * 8.5) % duration)
  const lift = -4 + ((index * 7) % 9)
  const opacity = 0.6 + ((index * 11) % 15) / 100

  return {
    '--bat-top': `${top}vh`,
    '--bat-size': `${size}px`,
    '--bat-duration': `${duration}s`,
    '--bat-delay': `${delay.toFixed(2)}s`,
    '--bat-opacity': opacity.toFixed(2),
    '--bat-x-mid': '58vw',
    '--bat-y-mid': `${lift}vh`,
    '--bat-x-end': '126vw',
    '--bat-y-end': `${lift * -0.35}vh`,
    '--bat-rotate-mid': `${-4 + ((index * 5) % 9)}deg`,
    '--bat-rotate-end': `${3 - ((index * 3) % 7)}deg`,
  }
}

function createGhost(index: number): GhostStyle {
  const left = 8 + ((index * 17) % 84)
  const top = 22 + ((index * 19) % 58)
  const size = 25 + ((index * 7) % 15)
  const duration = 12 + ((index * 5) % 10)
  const delay = -((index * 2.7) % duration)
  const drift = -3 + ((index * 5) % 7)
  const lift = -4 - ((index * 3) % 5)
  const rotate = -4 + ((index * 3) % 9)
  const opacity = 0.18 + ((index * 7) % 14) / 100

  return {
    '--ghost-left': `${Math.min(94, Math.max(4, left))}vw`,
    '--ghost-top': `${top}vh`,
    '--ghost-size': `${size}px`,
    '--ghost-duration': `${duration}s`,
    '--ghost-delay': `${delay.toFixed(2)}s`,
    '--ghost-opacity': opacity.toFixed(2),
    '--ghost-x-mid': `${drift * 0.55}vw`,
    '--ghost-y-mid': `${lift * 0.55}vh`,
    '--ghost-x-end': `${drift}vw`,
    '--ghost-y-end': `${lift}vh`,
    '--ghost-rotate-mid': `${rotate * 0.45}deg`,
    '--ghost-rotate-end': `${rotate}deg`,
  }
}
