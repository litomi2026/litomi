import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

import { ResultCard } from './ResultCard'
import { ImportResult } from './types'

type Props = {
  importResult: ImportResult
  isVisible: boolean
}

export function CompleteStep({ importResult, isVisible }: Props) {
  const t = useTranslations('Library.bookmark')

  return (
    <div
      aria-hidden={!isVisible}
      className="absolute inset-0 transition aria-hidden:opacity-0 aria-hidden:pointer-events-none"
    >
      <div className="flex flex-col h-full p-6">
        <div className="text-center mb-4">
          <div
            className={twMerge(
              'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg transition border-2 bg-linear-to-br',
              'from-emerald-600/20 to-emerald-500/10 text-emerald-400 border-emerald-600/30',
            )}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground">{t('uploadCompleteTitle')}</h3>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {importResult.imported > 0 && (
            <ResultCard count={importResult.imported} label={t('uploadSuccessLabel')} type="success" />
          )}
          {importResult.skipped > 0 && (
            <ResultCard count={importResult.skipped} label={t('uploadSkippedLabel')} type="warning" />
          )}
        </div>
      </div>
    </div>
  )
}
