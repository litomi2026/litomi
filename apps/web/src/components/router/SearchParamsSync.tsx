'use client'

import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useEffectEvent } from 'react'

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
  const update = useEffectEvent((nextSearchParams: ReadonlyURLSearchParams) => onUpdate(nextSearchParams))

  useEffect(() => {
    update(searchParams)
  }, [searchParams])

  return null
}
