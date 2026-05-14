'use client'

import React, { ComponentProps, ReactNode, useContext, useEffect, useRef, useState } from 'react'

type DropdownContentProps = {
  children: ReactNode
  align?: 'center' | 'end' | 'start'
  className?: string
}

type DropdownItemProps = {
  children: ReactNode
  onClick?: () => void
  className?: string
}

type DropdownProps = {
  children: ReactNode
}

type DropdownTriggerProps = ComponentProps<'button'>

const DropdownContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

export function Dropdown({ children }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative" ref={containerRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

const alignmentClasses = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
}

export function DropdownContent({ children, align = 'center', className = '' }: DropdownContentProps) {
  const context = useContext(DropdownContext)

  if (!context) {
    throw new Error('DropdownContent must be used within Dropdown')
  }

  if (!context.isOpen) {
    return null
  }

  return (
    <div
      className={`absolute top-full mt-1 z-50 min-w-[8rem] overflow-hidden rounded-lg 
        bg-zinc-900 border border-zinc-800 shadow-lg ${alignmentClasses[align]} ${className}`}
    >
      {children}
    </div>
  )
}

export function DropdownItem({ children, onClick, className = '' }: DropdownItemProps) {
  const context = useContext(DropdownContext)

  if (!context) {
    throw new Error('DropdownItem must be used within Dropdown')
  }

  const handleClick = () => {
    onClick?.()
    context.setIsOpen(false)
  }

  return (
    <button
      className={`flex w-full items-center px-3 py-2 text-sm hover:bg-zinc-800 
        transition ${className}`}
      onClick={handleClick}
      type="button"
    >
      {children}
    </button>
  )
}

export function DropdownTrigger({ children, onClick, ...props }: DropdownTriggerProps) {
  const context = useContext(DropdownContext)

  if (!context) {
    throw new Error('DropdownTrigger must be used within Dropdown')
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context.setIsOpen(!context.isOpen)
  }

  return (
    <button {...props} onClick={handleClick} type="button">
      {children}
    </button>
  )
}
