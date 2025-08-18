'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

type Props = {
  queryKey: string
  onUpdate: (value: string) => void
}

export default function UpdateFromSearchParams({ queryKey, onUpdate }: Readonly<Props>) {
  return (
    <Suspense>
      <UpdateValueFromSearchParams onUpdate={onUpdate} queryKey={queryKey} />
    </Suspense>
  )
}

function UpdateValueFromSearchParams({ queryKey, onUpdate }: Readonly<Props>) {
  const searchParams = useSearchParams()
  const value = searchParams.get(queryKey) ?? ''

  useEffect(() => {
    onUpdate(value)
  }, [value, onUpdate])

  return null
}
