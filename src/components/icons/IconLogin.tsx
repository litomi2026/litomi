type Props = {
  className?: string
  selected?: boolean
}

export default function IconLogin({ className, selected }: Readonly<Props>) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={selected ? 3 : 2}
      viewBox="0 0 24 24"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
      <polyline points="10 17 15 12 10 7"></polyline>
      <line x1="15" x2="3" y1="12" y2="12"></line>
    </svg>
  )
}
