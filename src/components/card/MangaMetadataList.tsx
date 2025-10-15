import { Suspense } from 'react'

import MangaMetadataLink from './MangaMetadataLink'

type Props = {
  labeledValues: { value: string; label: string }[]
  filterType: string
}

export default function MangaMetadataList({ labeledValues, filterType }: Props) {
  return (
    <ul className="break-all">
      {labeledValues.map(({ value, label }, i) => (
        <Suspense key={value}>
          <MangaMetadataLink filterType={filterType} i={i} label={label} value={value} />
        </Suspense>
      ))}
    </ul>
  )
}
