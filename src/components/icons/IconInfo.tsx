import { ComponentProps } from 'react'

export default function IconInfo(props: ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" x2="12" y1="16" y2="12"></line>
      <line x1="12" x2="12.01" y1="8" y2="8"></line>
    </svg>
  )
}
