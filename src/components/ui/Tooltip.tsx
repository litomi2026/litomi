'use client'

import { ReactNode, useState } from 'react'

type Props = {
  children: ReactNode[]
}

export default function Tooltip({ children }: Props) {
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
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full z-50 p-2
          transition duration-300 opacity-0 aria-current:opacity-100 aria-current:pointer-events-auto group-hover:opacity-100"
        role="tooltip"
      >
        {children[1]}
      </div>
    </button>
  )
}
