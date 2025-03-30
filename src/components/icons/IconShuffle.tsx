import { ComponentProps } from 'react'

type Props = ComponentProps<'svg'>

export default function IconShuffle(props: Props) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      <polyline points="16 3 21 3 21 8"></polyline>
      <line x1="4" x2="21" y1="20" y2="3"></line>
      <polyline points="21 16 21 21 16 21"></polyline>
      <line x1="15" x2="21" y1="15" y2="21"></line>
      <line x1="4" x2="9" y1="4" y2="9"></line>
    </svg>
  )
}
