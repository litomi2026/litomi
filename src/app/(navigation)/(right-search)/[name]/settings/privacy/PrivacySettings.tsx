import { eq } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'

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
