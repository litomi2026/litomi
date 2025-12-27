import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import 'server-only'

import { POSTGRES_URL, SUPABASE_CERTIFICATE } from '@/constants/env'

import { bookmarkTable, readingHistoryTable, userRatingTable } from './activity'
import { bbatonGenderEnum, bbatonVerificationTable } from './bbaton'
import { userCensorshipTable } from './censorship'
import { libraryItemTable, libraryTable } from './library'
import {
  mangaSeenTable,
  notificationConditionTable,
  notificationCriteriaTable,
  notificationTable,
  pushSettingsTable,
  webPushTable,
} from './notification'
import { credentialTable } from './passkey'
import {
  adImpressionTokenTable,
  pointTransactionTable,
  userExpansionTable,
  userItemTable,
  userPointsTable,
} from './points'
import { postLikeTable, postTable } from './post'
import { trustedBrowserTable, twoFactorBackupCodeTable, twoFactorTable } from './two-factor'
import { userTable } from './user'

const schema = {
  userTable,
  bbatonGenderEnum,
  bbatonVerificationTable,
  bookmarkTable,
  libraryTable,
  libraryItemTable,
  userCensorshipTable,
  credentialTable,
  webPushTable,
  pushSettingsTable,
  notificationTable,
  notificationCriteriaTable,
  notificationConditionTable,
  mangaSeenTable,
  postTable,
  postLikeTable,
  readingHistoryTable,
  userRatingTable,
  adImpressionTokenTable,
  userPointsTable,
  pointTransactionTable,
  userExpansionTable,
  userItemTable,
  twoFactorTable,
  twoFactorBackupCodeTable,
  trustedBrowserTable,
} as const

const supabaseClient = postgres(POSTGRES_URL, {
  prepare: false,
  ssl: SUPABASE_CERTIFICATE ? { ca: SUPABASE_CERTIFICATE, rejectUnauthorized: true } : 'prefer',
})

export const db = drizzle({ client: supabaseClient, schema })
