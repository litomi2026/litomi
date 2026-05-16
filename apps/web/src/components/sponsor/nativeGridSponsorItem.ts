import type { NativeGridSponsor } from '@litomi/contracts'
import type { Key } from 'react'

export type NativeGridSponsorItem = {
  key: Key
  sponsor: NativeGridSponsor
  type: 'native-grid-sponsor'
}

export function insertNativeGridSponsorItem<TItem>(items: TItem[], sponsor?: NativeGridSponsor | null) {
  if (!sponsor || items.length === 0) {
    return items
  }

  const list: (NativeGridSponsorItem | TItem)[] = items
  const index = Math.min(sponsor.position, items.length)

  const sponsorItem: NativeGridSponsorItem = {
    key: `native-grid-sponsor-${sponsor.placementId}-${sponsor.id}`,
    sponsor,
    type: 'native-grid-sponsor',
  }

  return list.toSpliced(index, 0, sponsorItem)
}
