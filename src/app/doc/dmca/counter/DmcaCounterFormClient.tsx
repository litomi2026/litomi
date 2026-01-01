'use client'

import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

type FormCopy = {
  title: string
  claimantSection: string
  claimantName: string
  claimantEmail: string
  claimantAddress: string
  claimantPhone: string
  relatedSection: string
  relatedNoticeId: string
  infringingReferences: string
  infringingHelp: string
  claimSection: string
  claimDetails: string
  evidenceLinks: string
  statementsSection: string
  goodFaith: string
  perjury: string
  signature: string
  submit: string
}

type Lang = 'en' | 'ko'

type Props = {
  dmcaEmail: string
  lang: Lang
  submitAction: SubmitAction
  t: FormCopy
}

type SubmitAction = (formData: FormData) => Promise<void> | void

const inputClass =
  'w-full rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700'
const textareaClass = `${inputClass} min-h-28 resize-y`

export default function DmcaCounterFormClient({ dmcaEmail, lang, submitAction, t }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [template, setTemplate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  const mailtoHref = useMemo(() => {
    if (!template) return `mailto:${dmcaEmail}`
    const subject = lang === 'en' ? 'DMCA Counter Notice' : 'DMCA 이의제기(카운터 노티스)'
    return `mailto:${dmcaEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(template)}`
  }, [dmcaEmail, lang, template])

  async function handleCopyTemplate() {
    if (isGenerating) return

    setIsGenerating(true)
    try {
      const form = formRef.current
      if (!form) {
        return
      }

      if (!form.reportValidity()) {
        return
      }

      const formData = new FormData(form)
      const nextTemplate = buildCounterTemplate(lang, t, formData)
      setTemplate(nextTemplate)

      await navigator.clipboard.writeText(nextTemplate)
      toast.success(
        lang === 'en' ? 'Copied. Please paste it into your email.' : '복사됐어요. 메일에 붙여넣어 보내 주세요.',
      )
    } catch {
      toast.error(lang === 'en' ? 'Could not copy. Please copy manually.' : '복사하지 못했어요. 직접 복사해 주세요.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid gap-4">
      <form action={submitAction} className="grid gap-6" ref={formRef}>
        <input name="lang" type="hidden" value={lang} />

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">{t.claimantSection}</h2>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="claimant-name">
              {t.claimantName}
            </label>
            <input className={inputClass} id="claimant-name" name="claimant-name" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="claimant-email">
              {t.claimantEmail}
            </label>
            <input className={inputClass} id="claimant-email" name="claimant-email" required type="email" />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="claimant-address">
              {t.claimantAddress}
            </label>
            <textarea className={textareaClass} id="claimant-address" name="claimant-address" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="claimant-phone">
              {t.claimantPhone}
            </label>
            <input className={inputClass} id="claimant-phone" name="claimant-phone" required />
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">{t.relatedSection}</h2>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="related-notice-id">
              {t.relatedNoticeId}
            </label>
            <input className={inputClass} id="related-notice-id" name="related-notice-id" />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="infringing-references">
              {t.infringingReferences}
            </label>
            <textarea className={textareaClass} id="infringing-references" name="infringing-references" required />
            <p className="text-xs text-zinc-500">{t.infringingHelp}</p>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">{t.claimSection}</h2>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="claim-details">
              {t.claimDetails}
            </label>
            <textarea className={textareaClass} id="claim-details" name="claim-details" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="evidence-links">
              {t.evidenceLinks}
            </label>
            <textarea className={textareaClass} id="evidence-links" name="evidence-links" />
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">{t.statementsSection}</h2>

          <label className="flex gap-2 text-sm text-zinc-300">
            <input
              className="mt-0.5 accent-zinc-200"
              id="good-faith-confirmed"
              name="good-faith-confirmed"
              required
              type="checkbox"
            />
            <span>{t.goodFaith}</span>
          </label>

          <label className="flex gap-2 text-sm text-zinc-300">
            <input
              className="mt-0.5 accent-zinc-200"
              id="perjury-confirmed"
              name="perjury-confirmed"
              required
              type="checkbox"
            />
            <span>{t.perjury}</span>
          </label>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="signature">
              {t.signature}
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
            {t.submit}
          </button>
          <button
            aria-disabled={isGenerating}
            className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 aria-disabled:opacity-60"
            onClick={handleCopyTemplate}
            type="button"
          >
            {lang === 'en' ? 'Copy template' : '템플릿 복사'}
          </button>
          <a
            className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
            href={mailtoHref}
          >
            {lang === 'en' ? 'Open email app' : '메일 앱 열기'}
          </a>
        </div>
      </form>

      {template && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-zinc-200">
              {lang === 'en' ? 'Email template' : '메일 템플릿'}
            </div>
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

function buildCounterTemplate(lang: Lang, t: FormCopy, formData: FormData): string {
  const lines = [
    `[${t.title}]`,
    '',
    `${t.claimantSection}`,
    `- ${t.claimantName}: ${getValue(formData, 'claimant-name')}`,
    `- ${t.claimantEmail}: ${getValue(formData, 'claimant-email')}`,
    `- ${t.claimantPhone}: ${getValue(formData, 'claimant-phone')}`,
    `- ${t.claimantAddress}:`,
    getValue(formData, 'claimant-address') || '(empty)',
    '',
    `${t.relatedSection}`,
    `- ${t.relatedNoticeId}: ${getValue(formData, 'related-notice-id') || '(optional)'}`,
    `- ${t.infringingReferences}:`,
    getValue(formData, 'infringing-references') || '(empty)',
    '',
    `${t.claimSection}`,
    `- ${t.claimDetails}:`,
    getValue(formData, 'claim-details') || '(empty)',
    `- ${t.evidenceLinks}:`,
    getValue(formData, 'evidence-links') || '(optional)',
    '',
    `${t.statementsSection}`,
    `- ${t.goodFaith}: ${isChecked(formData, 'good-faith-confirmed') ? 'Y' : 'N'}`,
    `- ${t.perjury}: ${isChecked(formData, 'perjury-confirmed') ? 'Y' : 'N'}`,
    `- ${t.signature}: ${getValue(formData, 'signature')}`,
  ]

  if (lang === 'en') {
    lines.unshift('Counter Notice')
  } else {
    lines.unshift('카운터 노티스')
  }

  return lines.join('\n')
}

function getValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function isChecked(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}
