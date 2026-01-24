import { desc, sum } from 'drizzle-orm'

import { db } from '@/database/supabase/drizzle'
import { DONATION_RECIPIENT_TYPE, pointDonationRecipientTable } from '@/database/supabase/points'
import { translateArtistList } from '@/translation/artist'
import { translateGroupList } from '@/translation/group'

export type DonationRankingItem = {
  type: 'artist' | 'group'
  value: string
  label: string
  totalReceived: number
}

function toDisplayValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.replace(/_/g, ' ')
}

const TOP_RECIPIENTS = 50

export async function getDonationRanking(): Promise<DonationRankingItem[]> {
  const rows = await db
    .select({
      recipientType: pointDonationRecipientTable.recipientType,
      recipientValue: pointDonationRecipientTable.recipientValue,
      total: sum(pointDonationRecipientTable.amount),
    })
    .from(pointDonationRecipientTable)
    .groupBy(pointDonationRecipientTable.recipientType, pointDonationRecipientTable.recipientValue)
    .orderBy(({ total }) => desc(total))
    .limit(TOP_RECIPIENTS)

  const artistValues: string[] = []
  const groupValues: string[] = []
  for (const r of rows) {
    if (r.recipientType === DONATION_RECIPIENT_TYPE.ARTIST) {
      artistValues.push(r.recipientValue)
    } else if (r.recipientType === DONATION_RECIPIENT_TYPE.GROUP) {
      groupValues.push(r.recipientValue)
    }
  }

  const artistLabelMap = new Map<string, string>()
  for (const item of translateArtistList(artistValues, 'ko') ?? []) {
    artistLabelMap.set(item.value, item.label)
  }

  const groupLabelMap = new Map<string, string>()
  for (const item of translateGroupList(groupValues, 'ko') ?? []) {
    groupLabelMap.set(item.value, item.label)
  }

  return rows.map((r) => {
    const type = r.recipientType === DONATION_RECIPIENT_TYPE.ARTIST ? 'artist' : 'group'
    const labelRaw =
      type === 'artist' ? (artistLabelMap.get(r.recipientValue) ?? '') : (groupLabelMap.get(r.recipientValue) ?? '')
    const label = labelRaw.trim() ? labelRaw : toDisplayValue(r.recipientValue) || r.recipientValue

    return {
      type,
      value: r.recipientValue,
      label,
      totalReceived: Number(r.total ?? 0),
    }
  })
}
