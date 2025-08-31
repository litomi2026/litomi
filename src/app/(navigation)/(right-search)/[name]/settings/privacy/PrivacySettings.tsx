import { sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'

import AutoDeletionForm from './AutoDeletionForm'

type Props = {
  userId: string
}

export default async function PrivacySettings({ userId }: Props) {
  const [user] = await db
    .select({ autoDeletionDays: userTable.autoDeletionDays })
    .from(userTable)
    .where(sql`${userTable.id} = ${userId}`)

  return <AutoDeletionForm autoDeletionDays={user.autoDeletionDays} />
}
