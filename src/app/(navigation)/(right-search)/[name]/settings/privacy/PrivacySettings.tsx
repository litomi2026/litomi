import { eq } from 'drizzle-orm'

import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'

import AutoDeletionForm from './AutoDeletionForm'

type Props = {
  userId: number
}

export default async function PrivacySettings({ userId }: Props) {
  const [user] = await db
    .select({ autoDeletionDays: userTable.autoDeletionDays })
    .from(userTable)
    .where(eq(userTable.id, userId))

  return <AutoDeletionForm autoDeletionDays={user.autoDeletionDays} />
}
