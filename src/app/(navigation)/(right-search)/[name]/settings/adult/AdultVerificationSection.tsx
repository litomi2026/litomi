import { and, eq, isNull } from 'drizzle-orm'

import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'
import { twoFactorTable } from '@/database/supabase/two-factor'

import AdultVerificationSectionClient from './AdultVerificationSectionClient'

type Props = {
  userId: number
}

export default async function AdultVerificationSection({ userId }: Props) {
  const [[verification], [twoFactor]] = await Promise.all([
    db
      .select({
        adultFlag: bbatonVerificationTable.adultFlag,
        verifiedAt: bbatonVerificationTable.verifiedAt,
      })
      .from(bbatonVerificationTable)
      .where(eq(bbatonVerificationTable.userId, userId)),
    db
      .select({ userId: twoFactorTable.userId })
      .from(twoFactorTable)
      .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt))),
  ])

  return <AdultVerificationSectionClient initialVerification={verification} isTwoFactorEnabled={!!twoFactor} />
}
