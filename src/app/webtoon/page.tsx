import { Suspense } from 'react'

import WebtoonListPage from './WebtoonList'

export default function WebtoonPage() {
  return (
    <Suspense>
      <WebtoonListPage />
    </Suspense>
  )
}
