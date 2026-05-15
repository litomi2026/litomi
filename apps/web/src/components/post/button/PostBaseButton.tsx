import type { ReactNode } from 'react'

type Props = {
  disabled: boolean
  children: ReactNode
  onClick?: () => void
}

export default function PostBaseButton({ disabled, children, onClick }: Readonly<Props>) {
  return (
    <label
      aria-disabled={disabled}
      className="hover:bg-zinc-500/50 h-fit cursor-pointer rounded-full p-2 transition aria-disabled:cursor-not-allowed aria-disabled:text-zinc-500 hover:aria-disabled:bg-transparent"
      onClick={onClick}
    >
      {children}
    </label>
  )
}
