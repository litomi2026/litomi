'use client'

import { env } from '@litomi/env/client'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  dmcaEmail: string
}

const inputClass =
  'w-full rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700'
const textareaClass = `${inputClass} min-h-28 resize-y`
const { NEXT_PUBLIC_API_ORIGIN } = env

export default function DmcaCounterFormClient({ dmcaEmail }: Props) {
  const locale = useLocale()
  const t = useTranslations('Doc.dmca.counter.form')
  const formRef = useRef<HTMLFormElement | null>(null)
  const [template, setTemplate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const formActionURL = new URL('/api/v1/dmca/counter', NEXT_PUBLIC_API_ORIGIN)
  formActionURL.searchParams.set('locale', locale)
  const formAction = formActionURL.toString()

  const mailtoHref = template
    ? `mailto:${dmcaEmail}?subject=${encodeURIComponent(t('mailSubject'))}&body=${encodeURIComponent(template)}`
    : `mailto:${dmcaEmail}`

  async function handleCopyTemplate() {
    if (isGenerating) {
      return
    }

    setIsGenerating(true)

    try {
      const form = formRef.current!

      if (!form.reportValidity()) {
        return
      }

      const formData = new FormData(form)

      const nextTemplate = [
        t('mailSubject'),
        `[${t('title')}]`,
        '',
        t('claimantSection'),
        `- ${t('claimantName')}: ${getValue(formData, 'claimant-name')}`,
        `- ${t('claimantEmail')}: ${getValue(formData, 'claimant-email')}`,
        `- ${t('claimantPhone')}: ${getValue(formData, 'claimant-phone')}`,
        `- ${t('claimantAddress')}:`,
        getValue(formData, 'claimant-address') || t('empty'),
        '',
        t('relatedSection'),
        `- ${t('relatedNoticeId')}: ${getValue(formData, 'related-notice-id') || t('optional')}`,
        `- ${t('infringingReferences')}:`,
        getValue(formData, 'infringing-references') || t('empty'),
        '',
        t('claimSection'),
        `- ${t('claimDetails')}:`,
        getValue(formData, 'claim-details') || t('empty'),
        `- ${t('evidenceLinks')}:`,
        getValue(formData, 'evidence-links') || t('optional'),
        '',
        t('statementsSection'),
        `- ${t('goodFaith')}: ${isChecked(formData, 'good-faith-confirmed') ? 'Y' : 'N'}`,
        `- ${t('perjury')}: ${isChecked(formData, 'perjury-confirmed') ? 'Y' : 'N'}`,
        `- ${t('signature')}: ${getValue(formData, 'signature')}`,
      ].join('\n')

      setTemplate(nextTemplate)

      await navigator.clipboard.writeText(nextTemplate)
      toast.success(t('copySuccess'))
    } catch {
      toast.error(t('copyError'))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid gap-4">
      <form action={formAction} className="grid gap-6" method="post" ref={formRef}>
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">{t('claimantSection')}</h2>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="claimant-name">
              {t('claimantName')}
            </label>
            <input className={inputClass} id="claimant-name" name="claimant-name" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="claimant-email">
              {t('claimantEmail')}
            </label>
            <input className={inputClass} id="claimant-email" name="claimant-email" required type="email" />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="claimant-address">
              {t('claimantAddress')}
            </label>
            <textarea className={textareaClass} id="claimant-address" name="claimant-address" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="claimant-phone">
              {t('claimantPhone')}
            </label>
            <input className={inputClass} id="claimant-phone" name="claimant-phone" required />
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">{t('relatedSection')}</h2>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="related-notice-id">
              {t('relatedNoticeId')}
            </label>
            <input className={inputClass} id="related-notice-id" name="related-notice-id" />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="infringing-references">
              {t('infringingReferences')}
            </label>
            <textarea className={textareaClass} id="infringing-references" name="infringing-references" required />
            <p className="text-xs text-zinc-500">{t('infringingHelp')}</p>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">{t('claimSection')}</h2>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="claim-details">
              {t('claimDetails')}
            </label>
            <textarea className={textareaClass} id="claim-details" name="claim-details" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="evidence-links">
              {t('evidenceLinks')}
            </label>
            <textarea className={textareaClass} id="evidence-links" name="evidence-links" />
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">{t('statementsSection')}</h2>

          <label className="flex gap-2 text-sm text-zinc-300">
            <input
              className="mt-0.5 accent-zinc-200"
              id="good-faith-confirmed"
              name="good-faith-confirmed"
              required
              type="checkbox"
            />
            <span>{t('goodFaith')}</span>
          </label>

          <label className="flex gap-2 text-sm text-zinc-300">
            <input
              className="mt-0.5 accent-zinc-200"
              id="perjury-confirmed"
              name="perjury-confirmed"
              required
              type="checkbox"
            />
            <span>{t('perjury')}</span>
          </label>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="signature">
              {t('signature')}
            </label>
            <input className={inputClass} id="signature" name="signature" required />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-disabled={isGenerating}
            className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 aria-disabled:opacity-60"
            type="submit"
          >
            {t('submit')}
          </button>
          <button
            aria-disabled={isGenerating}
            className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 aria-disabled:opacity-60"
            onClick={handleCopyTemplate}
            type="button"
          >
            {t('copyTemplate')}
          </button>
          <a
            className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
            href={mailtoHref}
          >
            {t('openEmailApp')}
          </a>
        </div>
      </form>

      {template && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-200">{t('emailTemplate')}</div>
            <a className="text-xs underline underline-offset-4 text-zinc-300 hover:text-zinc-100" href={mailtoHref}>
              {dmcaEmail}
            </a>
          </div>
          <textarea className={`${textareaClass} mt-3`} readOnly value={template} />
        </div>
      )}
    </div>
  )
}

function getValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function isChecked(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}
