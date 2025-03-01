type Props = {
  className?: string
}

export function IconFirstPage({ className }: Props) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M18 6L10 12L18 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M6 6V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

export function IconJumpNext({ className }: Props) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M7 6L13 12L7 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M13 6L19 12L13 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

export function IconJumpPrev({ className }: Props) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M17 6L11 12L17 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M11 6L5 12L11 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

export function IconLastPage({ className }: Props) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M6 6L14 12L6 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M18 6V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

export function IconNextPage({ className }: Props) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

export function IconPrevPage({ className }: Props) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}
