import type { Manga } from '@litomi/domain/types/manga'

import { CensorshipLevel } from '@litomi/domain/database/enum'

import useCensorshipsMapQuery from '@/query/useCensorshipsMapQuery'
import useMeQuery from '@/query/useMeQuery'
import { getHeavyCensorshipSignature, getMatchedCensorships } from '@/utils/manga-censorship'

export default function useMangaCensorship() {
  const { data: me } = useMeQuery()
  const { data: censorshipsMap } = useCensorshipsMapQuery()

  const heavySignature = getHeavyCensorshipSignature(censorshipsMap)
  const defaultCensorshipEnabled = me?.settings.defaultCensorshipEnabled

  function getMatch(manga: Manga) {
    return getMatchedCensorships({ manga, censorshipsMap, defaultCensorshipEnabled })
  }

  function isVisible(manga: Manga | undefined) {
    return !manga || getMatch(manga).highestCensorshipLevel !== CensorshipLevel.HEAVY
  }

  return { getMatch, heavySignature, isVisible }
}
