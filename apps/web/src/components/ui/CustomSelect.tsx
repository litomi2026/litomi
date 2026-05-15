'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { twMerge } from 'tailwind-merge'

import { ensureOverlayRoot } from '@/components/ui/overlayRoot'

interface CustomSelectProps {
  buttonClassName?: string
  className?: string
  defaultValue?: string
  disabled?: boolean
  id?: string
  name?: string
  onChange?: (value: string) => void
  options: readonly Option[]
  value?: string
}

interface Option {
  label: string
  value: string
}

export default function CustomSelect({
  buttonClassName,
  className,
  defaultValue,
  disabled = false,
  id,
  name,
  onChange,
  options,
  value: controlledValue,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const portalContainer = ensureOverlayRoot()

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const selectedOption = options.find((option) => option.value === value)

  function handleSelect(optionValue: string) {
    if (!isControlled) {
      setInternalValue(optionValue)
    }
    onChange?.(optionValue)
    setIsOpen(false)
  }

  // NOTE: 드롭다운 위치 계산 및 스크롤/리사이즈 시 업데이트
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function updatePosition() {
      if (!buttonRef.current) {
        return
      }

      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      const gap = 4
      const maxDropdownHeight = 240
      const shouldOpenAbove = spaceBelow < maxDropdownHeight && spaceAbove > spaceBelow

      let top: number
      let maxHeight: number

      if (shouldOpenAbove) {
        maxHeight = Math.min(maxDropdownHeight, spaceAbove - gap)
        top = rect.top - maxHeight - gap
      } else {
        maxHeight = Math.min(maxDropdownHeight, spaceBelow - gap)
        top = rect.bottom + gap
      }

      setDropdownPosition({
        top,
        left: rect.left,
        width: rect.width,
        maxHeight,
      })
    }

    updatePosition()

    window.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  // NOTE: ESC 키를 누르거나 외부 영역 클릭 시 드롭다운을 닫음
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      const isClickInsideContainer = containerRef.current?.contains(event.target as Node)
      const isClickInsideDropdown = dropdownRef.current?.contains(event.target as Node)

      if (!isClickInsideContainer && !isClickInsideDropdown) {
        setIsOpen(false)
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape, { capture: true })

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape, { capture: true })
    }
  }, [isOpen])

  return (
    <div className={className} ref={containerRef}>
      {name && <input name={name} type="hidden" value={value} />}
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={twMerge(
          'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-left',
          'hover:border-zinc-600 transition',
          'focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-between gap-2',
          buttonClassName,
        )}
        disabled={disabled}
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        ref={buttonRef}
        type="button"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown aria-selected={isOpen} className="size-4 shrink-0 transition aria-selected:rotate-180" />
      </button>
      {isOpen &&
        portalContainer &&
        createPortal(
          <div
            className="pointer-events-auto absolute z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-auto"
            ref={dropdownRef}
            role="listbox"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              maxHeight: `${dropdownPosition.maxHeight}px`,
            }}
          >
            {options.map((option) => (
              <button
                aria-selected={option.value === value}
                className={twMerge(
                  'block w-full px-3 py-2 text-left text-zinc-100 hover:bg-zinc-700 transition',
                  'first:rounded-t-lg last:rounded-b-lg aria-selected:bg-zinc-700/50',
                  buttonClassName,
                )}
                key={option.value}
                onClick={(e) => {
                  e.preventDefault()
                  handleSelect(option.value)
                }}
                role="option"
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>,
          portalContainer,
        )}
    </div>
  )
}
