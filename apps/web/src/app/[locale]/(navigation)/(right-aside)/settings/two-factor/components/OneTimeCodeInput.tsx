'use client'

import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export default function OneTimeCodeInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      autoCapitalize="off"
      autoComplete="one-time-code"
      autoCorrect="off"
      className={twMerge(
        'w-full rounded-lg bg-zinc-800 px-4 py-3 text-center text-xl font-mono text-zinc-100 placeholder-zinc-600',
        className,
      )}
      enterKeyHint="done"
      id="token"
      inputMode="numeric"
      maxLength={6}
      minLength={6}
      name="token"
      pattern="[0-9]*"
      placeholder="000000"
      required
      spellCheck={false}
      type="text"
      {...props}
    />
  )
}
