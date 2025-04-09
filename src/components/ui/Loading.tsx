import { ComponentProps } from 'react'

export default function Loading({ className = '' }: ComponentProps<'div'>) {
  return (
    <div className={`flex animate-fade-in duration-1000 translate-y-0.5 gap-2 ${className}`}>
      <span className="sr-only">Loading...</span>
      <div className="w-1/4 shrink-0 aspect-square animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
      <div className="w-1/4 shrink-0 aspect-square animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
      <div className="w-1/4 shrink-0 aspect-square animate-bounce rounded-full bg-current"></div>
    </div>
  )
}
