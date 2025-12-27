import { eq } from 'drizzle-orm'

import { db } from '@/database/supabase/drizzle'
import { bbatonVerificationTable } from '@/database/supabase/schema'

import AdultVerificationSectionClient from './AdultVerificationSectionClient'

type Props = {
  userId: number
}

export default async function AdultVerificationSection({ userId }: Props) {
  const [verification] = await db
    .select({
      adultFlag: bbatonVerificationTable.adultFlag,
      verifiedAt: bbatonVerificationTable.verifiedAt,
    })
    .from(bbatonVerificationTable)
    .where(eq(bbatonVerificationTable.userId, userId))

  return <AdultVerificationSectionClient initialVerification={verification} />
}
