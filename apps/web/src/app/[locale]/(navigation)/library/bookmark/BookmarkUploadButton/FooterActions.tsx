import { useTranslations } from 'next-intl'

import type { ImportState } from './types'

type Props = {
  importState: ImportState
  onClose: () => void
  onImport: () => void
  onReset: () => void
}

const BUTTON_CLASS =
  'flex-1 px-6 py-3 bg-zinc-800/40 border-2 border-zinc-700/40 rounded-xl transition hover:bg-zinc-700/40 hover:border-zinc-600/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900 text-zinc-200'

const PRIMARY_BUTTON_CLASS =
  'flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-foreground rounded-xl transition border-2 border-transparent hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900'

export function FooterActions({ importState, onClose, onImport, onReset }: Props) {
  const t = useTranslations('Library.bookmark')
  const commonT = useTranslations('Library.common')

  if (importState === 'idle') {
    return (
      <button className={`w-full ${BUTTON_CLASS}`} onClick={onClose} type="button">
        {commonT('cancel')}
      </button>
    )
  }

  if (importState === 'preview') {
    return (
      <div className="flex gap-3">
        <button className={BUTTON_CLASS} onClick={onReset} type="button">
          {t('uploadBack')}
        </button>
        <button className={PRIMARY_BUTTON_CLASS} onClick={onImport} type="button">
          {t('uploadStart')}
        </button>
      </div>
    )
  }

  if (importState === 'importing') {
    return <div className="h-12" />
  }

  return (
    <div className="flex gap-3">
      <button className={BUTTON_CLASS} onClick={onReset} type="button">
        {t('uploadOtherFile')}
      </button>
      <button className={PRIMARY_BUTTON_CLASS} onClick={onClose} type="button">
        {t('uploadStepComplete')}
      </button>
    </div>
  )
}
