'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  dmcaEmail: string
}

const inputClass =
  'w-full rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700'

const textareaClass = `${inputClass} min-h-28 resize-y`

export default function DmcaNoticeFormClient({ dmcaEmail }: Props) {
  const locale = useLocale()
  const t = useTranslations('Doc.dmca.notice.form')
  const formRef = useRef<HTMLFormElement | null>(null)
  const [template, setTemplate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const formAction = `/api/v1/dmca/notice?${new URLSearchParams({ locale })}`

  const mailtoHref = template
    ? `mailto:${dmcaEmail}?subject=${encodeURIComponent(t('mailSubject'))}&body=${encodeURIComponent(template)}`
    : `mailto:${dmcaEmail}`

  async function handleCopyTemplate() {
    if (isGenerating) {
      return
    }

    setIsGenerating(true)

    const form = formRef.current

    if (!form?.reportValidity()) {
      setIsGenerating(false)
      return
    }

    const formData = new FormData(form)
    const reporterRole = getValue(formData, 'reporter-role')

    const nextTemplate = [
      t('mailSubject'),
      `[${t('noticeHeading')}]`,
      '',
      t('reporterSection'),
      `- ${t('reporterName')}: ${getValue(formData, 'reporter-name')}`,
      `- ${t('reporterEmail')}: ${getValue(formData, 'reporter-email')}`,
      `- ${t('reporterPhone')}: ${getValue(formData, 'reporter-phone')}`,
      `- ${t('reporterAddress')}:`,
      getValue(formData, 'reporter-address') || t('empty'),
      `- ${t('reporterRole')}: ${
        reporterRole === 'AUTHORIZED_AGENT'
          ? t('reporterRoleAgent')
          : reporterRole === 'COPYRIGHT_OWNER'
            ? t('reporterRoleOwner')
            : reporterRole
      }`,
      '',
      t('workSection'),
      `- ${t('workDescription')}:`,
      getValue(formData, 'copyrighted-work-description') || t('empty'),
      `- ${t('workURL')}: ${getValue(formData, 'copyrighted-work-url') || t('optional')}`,
      '',
      t('infringingSection'),
      `- ${t('infringingReferences')}:`,
      getValue(formData, 'infringing-references') || t('empty'),
      '',
      t('statementsSection'),
      `- ${t('goodFaith')}: ${isChecked(formData, 'good-faith-confirmed') ? 'Y' : 'N'}`,
      `- ${t('perjury')}: ${isChecked(formData, 'perjury-confirmed') ? 'Y' : 'N'}`,
      `- ${t('signature')}: ${getValue(formData, 'signature')}`,
    ].join('\n')

    setTemplate(nextTemplate)

    try {
      await navigator.clipboard.writeText(nextTemplate)
      toast.success(t('copySuccess'))
    } catch {
      toast.error(t('copyError'))
    }

    setIsGenerating(false)
  }

  return (
    <div className="grid gap-4">
      <form action={formAction} className="grid gap-6" method="post" ref={formRef}>
        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">{t('reporterSection')}</h3>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="reporter-name">
              {t('reporterName')}
            </label>
            <input className={inputClass} id="reporter-name" name="reporter-name" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="reporter-email">
              {t('reporterEmail')}
            </label>
            <input className={inputClass} id="reporter-email" name="reporter-email" required type="email" />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="reporter-address">
              {t('reporterAddress')}
            </label>
            <textarea className={textareaClass} id="reporter-address" name="reporter-address" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="reporter-phone">
              {t('reporterPhone')}
            </label>
            <input className={inputClass} id="reporter-phone" name="reporter-phone" required />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="reporter-role">
              {t('reporterRole')}
            </label>
            <select
              className={`${inputClass} appearance-none`}
              defaultValue="COPYRIGHT_OWNER"
              id="reporter-role"
              name="reporter-role"
              required
            >
              <option value="COPYRIGHT_OWNER">{t('reporterRoleOwner')}</option>
              <option value="AUTHORIZED_AGENT">{t('reporterRoleAgent')}</option>
            </select>
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">{t('workSection')}</h3>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="copyrighted-work-description">
              {t('workDescription')}
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
              {t('workURL')}
            </label>
            <input className={inputClass} id="copyrighted-work-url" inputMode="url" name="copyrighted-work-url" />
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">{t('infringingSection')}</h3>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400" htmlFor="infringing-references">
              {t('infringingReferences')}
            </label>
            <textarea
              className={textareaClass}
              id="infringing-references"
              name="infringing-references"
              placeholder={t('infringingPlaceholder')}
              required
            />
            <p className="text-xs text-zinc-500">{t('infringingHelp')}</p>
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">{t('statementsSection')}</h3>

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
