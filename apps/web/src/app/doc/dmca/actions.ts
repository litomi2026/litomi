'use server'

import {
  dmcaCounterNoticeTable,
  dmcaCounterTargetTable,
  dmcaNoticeTable,
  dmcaNoticeTargetTable,
} from '@litomi/db/database/app/dmca'
import { db } from '@litomi/db/database/app/drizzle'
import { MAX_MANGA_ID } from '@litomi/domain/constants/policy'
import { normalizeString } from '@litomi/std'
import { captureException } from '@sentry/nextjs'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const langSchema = z.enum(['ko', 'en']).default('ko')
type Lang = z.infer<typeof langSchema>

const reporterRoleSchema = z.enum(['COPYRIGHT_OWNER', 'AUTHORIZED_AGENT'])

const noticeFormSchema = z.object({
  lang: langSchema,
  reporterName: z.string().trim().min(1).max(128),
  reporterEmail: z.string().trim().email().max(320),
  reporterAddress: z.string().trim().min(1).max(10_000),
  reporterPhone: z.string().trim().min(1).max(32),
  reporterRole: reporterRoleSchema,
  copyrightedWorkDescription: z.string().trim().min(1).max(100_000),
  copyrightedWorkURL: z.string().trim().max(10_000).optional(),
  infringingReferencesRaw: z.string().trim().min(1).max(100_000),
  goodFaithConfirmed: z.boolean(),
  perjuryConfirmed: z.boolean(),
  signature: z.string().trim().min(1).max(128),
})

const counterFormSchema = z.object({
  lang: langSchema,
  claimantName: z.string().trim().min(1).max(128),
  claimantEmail: z.string().trim().email().max(320),
  claimantAddress: z.string().trim().min(1).max(10_000),
  claimantPhone: z.string().trim().min(1).max(32),
  relatedNoticeId: z.string().trim().uuid().optional(),
  claimDetails: z.string().trim().min(1).max(100_000),
  evidenceLinks: z.string().trim().max(100_000).optional(),
  infringingReferencesRaw: z.string().trim().min(1).max(100_000),
  goodFaithConfirmed: z.boolean(),
  perjuryConfirmed: z.boolean(),
  signature: z.string().trim().min(1).max(128),
})

const MAX_TARGETS_PER_SUBMISSION = 200

export async function submitDmcaCounterNotice(formData: FormData) {
  const lang = getLangFromFormData(formData)

  const payload = {
    lang,
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
    redirect(`/doc/dmca/counter?lang=${lang}&error=invalid`)
  }

  const data = validation.data
  const mangaIds = extractMangaIdsFromText(data.infringingReferencesRaw)

  if (mangaIds.length === 0) {
    redirect(`/doc/dmca/counter?lang=${lang}&error=no-target`)
  }

  const counterId = crypto.randomUUID()

  try {
    await db.transaction(async (tx) => {
      await tx.insert(dmcaCounterNoticeTable).values({
        id: counterId,
        locale: data.lang,
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
    console.error('submitDmcaCounterNotice error:', error)
    captureException(error)
    redirect(`/doc/dmca/counter?lang=${lang}&error=server`)
  }

  redirect(`/doc/dmca/counter/success?lang=${lang}&case=${counterId}`)
}

export async function submitDmcaNotice(formData: FormData) {
  const lang = getLangFromFormData(formData)

  const payload = {
    lang,
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
    redirect(`/doc/dmca?lang=${lang}&error=invalid`)
  }

  const data = validation.data
  const mangaIds = extractMangaIdsFromText(data.infringingReferencesRaw)

  if (mangaIds.length === 0) {
    redirect(`/doc/dmca?lang=${lang}&error=no-target`)
  }

  const noticeId = crypto.randomUUID()

  try {
    await db.transaction(async (tx) => {
      await tx.insert(dmcaNoticeTable).values({
        id: noticeId,
        locale: data.lang,
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
    console.error('submitDmcaNotice error:', error)
    captureException(error)
    redirect(`/doc/dmca?lang=${lang}&error=server`)
  }

  redirect(`/doc/dmca/success?lang=${lang}&case=${noticeId}`)
}

function extractMangaIdsFromText(text: string): number[] {
  const ids: number[] = []

  // 1) whole-line numeric ids
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed)
      if (Number.isInteger(n) && n > 0 && n <= MAX_MANGA_ID) ids.push(n)
    }
  }

  // 2) URLs like /manga/123
  const urlRegex = /\/manga\/(\d+)/g
  for (const match of text.matchAll(urlRegex)) {
    const n = Number(match[1])
    if (Number.isInteger(n) && n > 0 && n <= MAX_MANGA_ID) ids.push(n)
  }

  return Array.from(new Set(ids)).slice(0, MAX_TARGETS_PER_SUBMISSION)
}

function getLangFromFormData(formData: FormData): Lang {
  const raw = formData.get('lang')
  return langSchema.parse(typeof raw === 'string' ? raw : undefined)
}
