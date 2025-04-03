import { ComponentProps } from 'react'

export default function IconChart(props: ComponentProps<'svg'>) {
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
      <line x1="18" x2="18" y1="20" y2="10"></line>
      <line x1="12" x2="12" y1="20" y2="4"></line>
      <line x1="6" x2="6" y1="20" y2="14"></line>
    </svg>
  )
}
