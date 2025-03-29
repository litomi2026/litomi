import { ComponentProps } from 'react'

export default function Loading({ className }: ComponentProps<'div'>) {
  return (
    <div className={`flex translate-y-0.5 gap-2 p-2 ${className}`}>
      <span className="sr-only">Loading...</span>
      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
    </div>
  )
}
