'use client'

import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

type Props = {
  onUpdate: (searchParams: ReadonlyURLSearchParams) => void
}

export default function UpdateFromSearchParams({ onUpdate }: Readonly<Props>) {
  return (
    <Suspense>
      <UpdateValueFromSearchParams onUpdate={onUpdate} />
    </Suspense>
  )
}

function UpdateValueFromSearchParams({ onUpdate }: Readonly<Props>) {
  const searchParams = useSearchParams()

  useEffect(() => {
    onUpdate(searchParams)
  }, [onUpdate, searchParams])

  return null
}
