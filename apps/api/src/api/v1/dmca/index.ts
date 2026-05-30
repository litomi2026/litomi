import { db } from '@litomi/db/app'
import {
  dmcaCounterNoticeTable,
  dmcaCounterTargetTable,
  dmcaNoticeTable,
  dmcaNoticeTargetTable,
} from '@litomi/db/app/dmca'
import { MAX_MANGA_ID } from '@litomi/domain/manga/policy'
import { env } from '@litomi/env/server.common'
import { normalizeString } from '@litomi/std'
import { type Context, Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/app'

const dmcaLocaleSchema = z.enum(['ko', 'en']).catch('ko')
const { APP_ORIGIN } = env

type DmcaLocale = z.infer<typeof dmcaLocaleSchema>

const reporterRoleSchema = z.enum(['COPYRIGHT_OWNER', 'AUTHORIZED_AGENT'])

const noticeFormSchema = z.object({
  locale: dmcaLocaleSchema,
  reporterName: z.string().trim().min(1).max(128),
  reporterEmail: z.email().trim().max(320),
  reporterAddress: z.string().trim().min(1).max(10_000),
  reporterPhone: z.string().trim().min(1).max(32),
  reporterRole: reporterRoleSchema,
  copyrightedWorkDescription: z.string().trim().min(1).max(100_000),
  copyrightedWorkURL: z.url().trim().max(10_000).optional(),
  infringingReferencesRaw: z.string().trim().min(1).max(100_000),
  goodFaithConfirmed: z.boolean(),
  perjuryConfirmed: z.boolean(),
  signature: z.string().trim().min(1).max(128),
})

const counterFormSchema = z.object({
  locale: dmcaLocaleSchema,
  claimantName: z.string().trim().min(1).max(128),
  claimantEmail: z.email().trim().max(320),
  claimantAddress: z.string().trim().min(1).max(10_000),
  claimantPhone: z.string().trim().min(1).max(32),
  relatedNoticeId: z.uuid().trim().optional(),
  claimDetails: z.string().trim().min(1).max(100_000),
  evidenceLinks: z.string().trim().max(100_000).optional(),
  infringingReferencesRaw: z.string().trim().min(1).max(100_000),
  goodFaithConfirmed: z.boolean(),
  perjuryConfirmed: z.boolean(),
  signature: z.string().trim().min(1).max(128),
})

const MAX_TARGETS_PER_SUBMISSION = 200

const route = new Hono<Env>()

route.post('/counter', async (c) => {
  const formData = await c.req.raw.formData()
  const locale = getLocaleFromRequest(c)

  const payload = {
    locale,
    claimantName: String(formData.get('claimant-name') ?? ''),
    claimantEmail: String(formData.get('claimant-email') ?? ''),
    claimantAddress: String(formData.get('claimant-address') ?? ''),
    claimantPhone: String(formData.get('claimant-phone') ?? ''),
    relatedNoticeId: normalizeString(String(formData.get('related-notice-id') ?? '')) ?? undefined,
    claimDetails: String(formData.get('claim-details') ?? ''),
    evidenceLinks: normalizeString(String(formData.get('evidence-links') ?? '')) ?? undefined,
    infringingReferencesRaw: String(formData.get('infringing-references') ?? ''),
    goodFaithConfirmed: formData.get('good-faith-confirmed') === 'on',
    perjuryConfirmed: formData.get('perjury-confirmed') === 'on',
    signature: String(formData.get('signature') ?? ''),
  }

  const validation = counterFormSchema.safeParse(payload)

  if (!validation.success) {
    return redirectTo(c, '/doc/dmca/counter', locale, 'invalid')
  }

  const data = validation.data
  const mangaIds = extractMangaIdsFromText(data.infringingReferencesRaw)

  if (mangaIds.length === 0) {
    return redirectTo(c, '/doc/dmca/counter', locale, 'no-target')
  }

  const counterId = crypto.randomUUID()

  try {
    await db.transaction(async (tx) => {
      await tx.insert(dmcaCounterNoticeTable).values({
        id: counterId,
        locale: data.locale,
        claimantName: data.claimantName,
        claimantEmail: data.claimantEmail,
        claimantAddress: data.claimantAddress,
        claimantPhone: data.claimantPhone,
        relatedNoticeId: data.relatedNoticeId,
        claimDetails: data.claimDetails,
        evidenceLinks: normalizeString(data.evidenceLinks ?? undefined),
        infringingReferencesRaw: data.infringingReferencesRaw,
        signature: data.signature,
        goodFaithConfirmed: data.goodFaithConfirmed,
        perjuryConfirmed: data.perjuryConfirmed,
      })

      await tx.insert(dmcaCounterTargetTable).values(
        mangaIds.map((mangaId) => ({
          counterId,
          mangaId,
        })),
      )
    })
  } catch (error) {
    console.error('submitDmcaCounterNotice:', error)
    return redirectTo(c, '/doc/dmca/counter', locale, 'server')
  }

  return redirectTo(c, '/doc/dmca/counter/success', locale, undefined, counterId)
})

route.post('/notice', async (c) => {
  const formData = await c.req.raw.formData()
  const locale = getLocaleFromRequest(c)

  const payload = {
    locale,
    reporterName: String(formData.get('reporter-name') ?? ''),
    reporterEmail: String(formData.get('reporter-email') ?? ''),
    reporterAddress: String(formData.get('reporter-address') ?? ''),
    reporterPhone: String(formData.get('reporter-phone') ?? ''),
    reporterRole: String(formData.get('reporter-role') ?? ''),
    copyrightedWorkDescription: String(formData.get('copyrighted-work-description') ?? ''),
    copyrightedWorkURL: normalizeString(String(formData.get('copyrighted-work-url') ?? '')) ?? undefined,
    infringingReferencesRaw: String(formData.get('infringing-references') ?? ''),
    goodFaithConfirmed: formData.get('good-faith-confirmed') === 'on',
    perjuryConfirmed: formData.get('perjury-confirmed') === 'on',
    signature: String(formData.get('signature') ?? ''),
  }

  const validation = noticeFormSchema.safeParse(payload)

  if (!validation.success) {
    return redirectTo(c, '/doc/dmca', locale, 'invalid')
  }

  const data = validation.data
  const mangaIds = extractMangaIdsFromText(data.infringingReferencesRaw)

  if (mangaIds.length === 0) {
    return redirectTo(c, '/doc/dmca', locale, 'no-target')
  }

  const noticeId = crypto.randomUUID()

  try {
    await db.transaction(async (tx) => {
      await tx.insert(dmcaNoticeTable).values({
        id: noticeId,
        locale: data.locale,
        reporterName: data.reporterName,
        reporterEmail: data.reporterEmail,
        reporterAddress: data.reporterAddress,
        reporterPhone: data.reporterPhone,
        reporterRole: data.reporterRole,
        copyrightedWorkDescription: data.copyrightedWorkDescription,
        copyrightedWorkURL: normalizeString(data.copyrightedWorkURL ?? undefined),
        infringingReferencesRaw: data.infringingReferencesRaw,
        goodFaithConfirmed: data.goodFaithConfirmed,
        perjuryConfirmed: data.perjuryConfirmed,
        signature: data.signature,
      })

      await tx.insert(dmcaNoticeTargetTable).values(
        mangaIds.map((mangaId) => ({
          noticeId,
          mangaId,
        })),
      )
    })
  } catch (error) {
    console.error('submitDmcaNotice:', error)
    return redirectTo(c, '/doc/dmca', locale, 'server')
  }

  return redirectTo(c, '/doc/dmca/success', locale, undefined, noticeId)
})

function extractMangaIdsFromText(text: string): number[] {
  const ids: number[] = []

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed)
      if (Number.isInteger(n) && n > 0 && n <= MAX_MANGA_ID) ids.push(n)
    }
  }

  const urlRegex = /\/manga\/(\d+)/g
  for (const match of text.matchAll(urlRegex)) {
    const n = Number(match[1])
    if (Number.isInteger(n) && n > 0 && n <= MAX_MANGA_ID) ids.push(n)
  }

  return Array.from(new Set(ids)).slice(0, MAX_TARGETS_PER_SUBMISSION)
}

function getLocaleFromRequest(c: Context<Env>): DmcaLocale {
  return dmcaLocaleSchema.parse(c.req.query('locale'))
}

function redirectTo(c: Context<Env>, path: string, locale: DmcaLocale, error?: string, caseId?: string) {
  const url = new URL(`/${locale}${path}`, APP_ORIGIN)

  if (error) {
    url.searchParams.set('error', error)
  }

  if (caseId) {
    url.searchParams.set('case', caseId)
  }

  return c.redirect(url.toString(), 303)
}

export default route
