'use client'

type Props = {
  className?: string
  selected?: boolean
}

export default function IconSearch({ className, selected }: Props) {
  return (
    <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24">
      <title>검색</title>
      {selected ? (
        <>
          <path
            d="M18.5 10.5a8 8 0 1 1-8-8 8 8 0 0 1 8 8Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <line
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            x1="16.511"
            x2="21.643"
            y1="16.511"
            y2="21.643"
          />
        </>
      ) : (
        <>
          <path
            d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <line
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            x1="16.511"
            x2="22"
            y1="16.511"
            y2="22"
          />
        </>
      )}
    </svg>
  )
}
