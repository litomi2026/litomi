'use client'

import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

type Variant = 'danger' | 'outline' | 'primary'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-indigo-500 text-white hover:bg-indigo-400',
  outline: 'border border-foreground/15 text-zinc-300 hover:bg-zinc-700/50',
  danger: 'bg-red-500/90 text-white hover:bg-red-500',
}

interface Props extends ComponentProps<'button'> {
  variant?: Variant
  /** In-flight state: disables the button and shows a spinner. */
  busy?: boolean
}

export default function Button({ variant = 'primary', busy = false, disabled, className, children, ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || busy}
      className={twMerge(
        'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
