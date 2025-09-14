'use client'

import { ComponentProps } from 'react'

export default function TokenInput(props: ComponentProps<'input'>) {
  return (
    <input
      {...props}
      autoComplete="false"
      className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-center text-xl font-mono text-zinc-100 placeholder-zinc-600"
      id="token"
      maxLength={6}
      minLength={6}
      name="token"
      pattern="[0-9]+"
      placeholder="000000"
      required
      type="text"
    />
  )
}
