'use client'

import { LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import { Bookmark } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { ImportModeOption } from './ImportModeOption'
import { BookmarkExportData, ImportMode } from './types'

type Props = {
  importMode: ImportMode
  isVisible: boolean
  previewData: BookmarkExportData
  setImportMode: (mode: ImportMode) => void
}

export function PreviewStep({ importMode, isVisible, previewData, setImportMode }: Props) {
  const locale = useLocale()
  const t = useTranslations('Library.bookmark')

  return (
    <div
      aria-hidden={!isVisible}
      className="absolute inset-0 transition aria-hidden:opacity-0 aria-hidden:pointer-events-none"
    >
      <div className="h-fit space-y-6 p-6">
        <div className="bg-linear-to-br from-blue-600/10 to-blue-500/5 rounded-2xl p-5 border border-blue-600/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Bookmark className="size-6 shrink-0 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg text-foreground">
                {t('uploadTotalBookmarks', {
                  count: previewData.totalCount.toLocaleString(LOCALE_LANGUAGE_TAGS[locale]),
                })}
              </p>
              {previewData.exportedAt && (
                <p className="text-sm text-zinc-400 mt-0.5">
                  {t('uploadExportedAt', {
                    date: new Date(previewData.exportedAt).toLocaleDateString(LOCALE_LANGUAGE_TAGS[locale]),
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">{t('uploadModeTitle')}</h3>
          <div className="space-y-3">
            <ImportModeOption
              colorScheme="blue"
              currentMode={importMode}
              description={t('uploadMergeDescription')}
              mode="merge"
              onChange={setImportMode}
              showBadge
              title={t('uploadMergeTitle')}
            />
            <ImportModeOption
              colorScheme="orange"
              currentMode={importMode}
              description={t('uploadReplaceDescription')}
              mode="replace"
              onChange={setImportMode}
              showWarning
              title={t('uploadReplaceTitle')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
