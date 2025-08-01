import type { ComponentProps } from 'react'

type Props = ComponentProps<'svg'>

export default function IconAlertTriangle(props: Readonly<Props>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" {...props}>
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line strokeLinecap="round" strokeLinejoin="round" x1="12" x2="12" y1="9" y2="13" />
      <line strokeLinecap="round" strokeLinejoin="round" x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  )
}
