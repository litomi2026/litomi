import { Suspense } from 'react'

import EpisodeViewer from './EpisodeViewer'

export default function WebtoonEpisodePage() {
  return (
    <Suspense>
      <EpisodeViewer />
    </Suspense>
  )
}
