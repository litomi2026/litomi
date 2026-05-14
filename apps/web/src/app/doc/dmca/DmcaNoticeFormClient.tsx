'use client'

import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { submitDmcaNotice } from './actions'

type FormCopy = {
  noticeHeading: string
  reporterSection: string
  reporterName: string
  reporterEmail: string
  reporterAddress: string
  reporterPhone: string
  reporterRole: string
  reporterRoleOwner: string
  reporterRoleAgent: string
  workSection: string
  workDescription: string
  workURL: string
  infringingSection: string
  infringingReferences: string
  infringingPlaceholder: string
  infringingHelp: string
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
  t: FormCopy
}

const inputClass =
  'w-full rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700'

const textareaClass = `${inputClass} min-h-28 resize-y`

export default function DmcaNoticeFormClient({ dmcaEmail, lang, t }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [template, setTemplate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  const mailtoHref = useMemo(() => {
    if (!template) {
      return `mailto:${dmcaEmail}`
    }
    const subject = lang === 'en' ? 'DMCA Notice' : 'DMCA 신고'
    return `mailto:${dmcaEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(template)}`
  }, [dmcaEmail, lang, template])

  async function handleCopyTemplate() {
    if (isGenerating) {
      return
    }

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
      const nextTemplate = buildNoticeTemplate(lang, t, formData)
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
      <form action={submitDmcaNotice} className="grid gap-6" ref={formRef}>
        <input name="lang" type="hidden" value={lang} />

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">{t.reporterSection}</h3>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="reporter-name">
              {t.reporterName}
            </label>
            <input className={inputClass} id="reporter-name" name="reporter-name" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="reporter-email">
              {t.reporterEmail}
            </label>
            <input className={inputClass} id="reporter-email" name="reporter-email" required type="email" />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="reporter-address">
              {t.reporterAddress}
            </label>
            <textarea className={textareaClass} id="reporter-address" name="reporter-address" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="reporter-phone">
              {t.reporterPhone}
            </label>
            <input className={inputClass} id="reporter-phone" name="reporter-phone" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="reporter-role">
              {t.reporterRole}
            </label>
            <select
              className={`${inputClass} appearance-none`}
              defaultValue="COPYRIGHT_OWNER"
              id="reporter-role"
              name="reporter-role"
              required
            >
              <option value="COPYRIGHT_OWNER">{t.reporterRoleOwner}</option>
              <option value="AUTHORIZED_AGENT">{t.reporterRoleAgent}</option>
            </select>
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">{t.workSection}</h3>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="copyrighted-work-description">
              {t.workDescription}
            </label>
            <textarea
              className={textareaClass}
              id="copyrighted-work-description"
              name="copyrighted-work-description"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="copyrighted-work-url">
              {t.workURL}
            </label>
            <input className={inputClass} id="copyrighted-work-url" inputMode="url" name="copyrighted-work-url" />
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">{t.infringingSection}</h3>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="infringing-references">
              {t.infringingReferences}
            </label>
            <textarea
              className={textareaClass}
              id="infringing-references"
              name="infringing-references"
              placeholder={t.infringingPlaceholder}
              required
            />
            <p className="text-xs text-zinc-500">{t.infringingHelp}</p>
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">{t.statementsSection}</h3>

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

function buildNoticeTemplate(lang: Lang, t: FormCopy, formData: FormData): string {
  const reporterRole = getValue(formData, 'reporter-role')

  const lines = [
    `[${t.noticeHeading}]`,
    '',
    `${t.reporterSection}`,
    `- ${t.reporterName}: ${getValue(formData, 'reporter-name')}`,
    `- ${t.reporterEmail}: ${getValue(formData, 'reporter-email')}`,
    `- ${t.reporterPhone}: ${getValue(formData, 'reporter-phone')}`,
    `- ${t.reporterAddress}:`,
    getValue(formData, 'reporter-address') || '(empty)',
    `- ${t.reporterRole}: ${
      reporterRole === 'AUTHORIZED_AGENT'
        ? t.reporterRoleAgent
        : reporterRole === 'COPYRIGHT_OWNER'
          ? t.reporterRoleOwner
          : reporterRole
    }`,
    '',
    `${t.workSection}`,
    `- ${t.workDescription}:`,
    getValue(formData, 'copyrighted-work-description') || '(empty)',
    `- ${t.workURL}: ${getValue(formData, 'copyrighted-work-url') || '(optional)'}`,
    '',
    `${t.infringingSection}`,
    `- ${t.infringingReferences}:`,
    getValue(formData, 'infringing-references') || '(empty)',
    '',
    `${t.statementsSection}`,
    `- ${t.goodFaith}: ${isChecked(formData, 'good-faith-confirmed') ? 'Y' : 'N'}`,
    `- ${t.perjury}: ${isChecked(formData, 'perjury-confirmed') ? 'Y' : 'N'}`,
    `- ${t.signature}: ${getValue(formData, 'signature')}`,
  ]

  if (lang === 'en') {
    lines.unshift('DMCA Notice')
  } else {
    lines.unshift('DMCA 신고')
  }

  return lines.join('\n')
}

function getValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

function isChecked(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}
