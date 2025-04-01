'use client'

import { ReactNode, useState } from 'react'

const positionStyle = {
  right: 'right-0 top-1/2 translate-x-full -translate-y-1/2',
  top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full',
  'bottom-right': 'top-full left-0',
}

type Props = {
  position: keyof typeof positionStyle
  children: ReactNode[]
}

export default function Tooltip({ children, position }: Props) {
  const [isActive, setIsActive] = useState(false)

  return (
    <button
      className="group relative focus:outline-none"
      onBlur={() => setIsActive(false)}
      onClick={() => setIsActive((prev) => !prev)}
      onFocus={() => setIsActive(true)}
      tabIndex={-1}
      type="button"
    >
      {children[0]}
      <div
        aria-current={isActive}
        className={`pointer-events-none absolute ${positionStyle[position]} z-50 p-2
          transition duration-300 opacity-0 aria-current:opacity-100 aria-current:pointer-events-auto group-hover:opacity-100`}
        role="tooltip"
      >
        {children[1]}
      </div>
    </button>
  )
}
