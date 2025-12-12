import { Suspense } from 'react'

import SeriesViewer from './SeriesViewer'

export default function WebtoonSeriesPage() {
  return (
    <Suspense>
      <SeriesViewer />
    </Suspense>
  )
}
