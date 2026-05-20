'use client'

import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

type Props = {
  onUpdate: (searchParams: ReadonlyURLSearchParams) => void
}

export default function SearchParamsSync({ onUpdate }: Props) {
  return (
    <Suspense fallback={null}>
      <SearchParamsSyncInner onUpdate={onUpdate} />
    </Suspense>
  )
}

function SearchParamsSyncInner({ onUpdate }: Props) {
  const searchParams = useSearchParams()

  useEffect(() => {
    onUpdate(searchParams)
  }, [onUpdate, searchParams])

  return null
}
