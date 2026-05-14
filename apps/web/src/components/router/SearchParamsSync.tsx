'use client'

import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

type Props = {
  onUpdate: (searchParams: ReadonlyURLSearchParams) => void
}

export default function SearchParamsSync({ onUpdate }: Readonly<Props>) {
  return (
    <Suspense fallback={null}>
      <SearchParamsSyncInner onUpdate={onUpdate} />
    </Suspense>
  )
}

function SearchParamsSyncInner({ onUpdate }: Readonly<Props>) {
  const searchParams = useSearchParams()

  useEffect(() => {
    onUpdate(searchParams)
  }, [onUpdate, searchParams])

  return null
}
