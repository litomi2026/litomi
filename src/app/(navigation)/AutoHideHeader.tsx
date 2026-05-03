'use client'

import type { ComponentPropsWithoutRef, MouseEvent } from 'react'

import { twMerge } from 'tailwind-merge'

import { revealNavigationAutoHide, useNavigationAutoHideState } from './navigationAutoHide'

type Props = Omit<ComponentPropsWithoutRef<'header'>, 'data-auto-hide'>

export default function AutoHideHeader({ children, className, onClick, ...props }: Props) {
  const isNavigationHidden = useNavigationAutoHideState()

  function handleClick(event: MouseEvent<HTMLElement>) {
    revealNavigationAutoHide()
    onClick?.(event)
  }

  return (
    <header
      {...props}
      className={twMerge('data-[auto-hide=true]:opacity-30', className)}
      data-auto-hide={isNavigationHidden || undefined}
      onClick={handleClick}
    >
      {children}
    </header>
  )
}
