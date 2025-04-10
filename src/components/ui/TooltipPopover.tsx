'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

const positionStyle = {
  right: 'right-0 top-1/2 translate-x-full -translate-y-1/2',
  top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full',
  'bottom-right': 'top-full left-0',
  bottom: 'top-full left-1/2 -translate-x-1/2',
  'bottom-left': 'top-full right-0',
  'top-right': 'top-0 left-0 -translate-y-full',
}

const typeStyle = {
  tooltip: 'peer-hover:opacity-100 peer-hover:pointer-events-auto',
  popover: '',
}

type Props = {
  position: keyof typeof positionStyle
  children: [ReactNode, ReactNode] // [trigger, tooltipContent]
  type: 'popover' | 'tooltip'
  className?: string
}

export default function TooltipPopover({ children, position, type, className = '' }: Props) {
  const [isActive, setIsActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsActive(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className={`relative flex items-center pointer-events-none ${className}`} ref={containerRef}>
      <button className="peer pointer-events-auto" onClick={() => setIsActive((prev) => !prev)} type="button">
        {children[0]}
      </button>
      <div
        aria-current={isActive}
        className={`pointer-events-none absolute z-50 p-2 transition duration-300 opacity-0 aria-current:opacity-100 aria-current:pointer-events-auto ${typeStyle[type]} ${positionStyle[position]}`}
        role="tooltip"
      >
        {children[1]}
      </div>
    </div>
  )
}
