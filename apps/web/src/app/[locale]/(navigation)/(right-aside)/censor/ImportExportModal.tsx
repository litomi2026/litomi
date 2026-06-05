'use client'

import type { CensorshipItem, POSTV1CensorshipCreateResponse } from '@litomi/contracts'

import { CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'
import { downloadBlob } from '@/utils/download'

const PLACEHOLDER_JSON = `[
  {
    "key": 0,
    "value": "example_tag",
    "level": 0
  }
]`

type ExportFormat = 'csv' | 'json'

const CSV_EXPORT_HEADERS = ['Key', 'Value', 'Level']

const CSV_EXPORT_KEY_LABELS = {
  [CensorshipKey.ARTIST]: 'Artist',
  [CensorshipKey.GROUP]: 'Group',
  [CensorshipKey.SERIES]: 'Series',
  [CensorshipKey.CHARACTER]: 'Character',
  [CensorshipKey.TAG]: 'Tag',
  [CensorshipKey.TAG_CATEGORY_FEMALE]: 'Female tag',
  [CensorshipKey.TAG_CATEGORY_MALE]: 'Male tag',
  [CensorshipKey.TAG_CATEGORY_MIXED]: 'Mixed tag',
  [CensorshipKey.TAG_CATEGORY_OTHER]: 'Other tag',
  [CensorshipKey.LANGUAGE]: 'Language',
  [CensorshipKey.UPLOADER]: 'Uploader',
  [CensorshipKey.TYPE]: 'Type',
} satisfies Record<CensorshipKey, string>

const CSV_EXPORT_LEVEL_LABELS = {
  [CensorshipLevel.LIGHT]: 'Blur',
  [CensorshipLevel.HEAVY]: 'Hide',
  [CensorshipLevel.NONE]: 'Allow',
} satisfies Record<CensorshipLevel, string>

type Props = {
  open: boolean
  onClose: () => void
  censorships: CensorshipItem[]
}

type Tab = 'export' | 'import'

export default function ImportExportModal({ open, onClose, censorships }: Props) {
  const [importText, setImportText] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('export')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const queryClient = useQueryClient()
  const t = useTranslations('Censorship')
  const { guardAdultAccess } = useAdultAccessGuard()

  const addMutation = useMutation({
    mutationFn: async (items: { key: number; value: string; level: number }[]) => {
      const url = '/api/v1/censorship'

      const { data } = await fetchAPIData<POSTV1CensorshipCreateResponse>(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      return data.ids
    },

    onSuccess: (ids) => {
      toast.success(t('importExport.importSuccessToast', { count: ids.length }))
      setImportText('')
      onClose()
      queryClient.invalidateQueries({ queryKey: QueryKeys.censorship })
    },
  })

  function handleExport() {
    let content: string
    let filename: string
    let mimeType: string

    try {
      if (exportFormat === 'json') {
        const exportData = censorships.map((c) => ({
          key: c.key,
          value: c.value,
          level: c.level,
        }))

        content = JSON.stringify(exportData, null, 2)
        filename = 'censorship-rules.json'
        mimeType = 'application/json'
      } else {
        const rows = censorships.map((c) => [CSV_EXPORT_KEY_LABELS[c.key], c.value, CSV_EXPORT_LEVEL_LABELS[c.level]])

        const csvContent = [CSV_EXPORT_HEADERS.join(','), ...rows.map((row) => row.map(formatCsvCell).join(','))].join(
          '\n',
        )

        content = csvContent
        filename = 'censorship-rules.csv'
        mimeType = 'text/csv'
      }

      const blob = new Blob([content], { type: mimeType })
      downloadBlob(blob, filename)
      toast.success(t('importExport.exportSuccessToast', { count: censorships.length }))
      onClose()
    } catch {
      toast.error(t('importExport.exportErrorToast'))
    }
  }

  function handleImport() {
    if (!guardAdultAccess()) {
      return
    }

    try {
      const data = JSON.parse(importText)

      if (!Array.isArray(data)) {
        throw new Error('Invalid format')
      }

      const items: { key: number; value: string; level: number }[] = []

      data.forEach((item) => {
        const key = item.key
        const level = item.level

        if (typeof key === 'number' && item.value && typeof level === 'number') {
          items.push({ key, value: item.value, level })
        }
      })

      addMutation.mutate(items)
    } catch {
      toast.warning(t('importExport.invalidJsonToast'))
    }
  }

  return (
    <Dialog ariaLabel={t('importExport.title')} className="sm:max-w-2xl" onClose={onClose} open={open}>
      <DialogHeader onClose={onClose} title={t('importExport.title')} />

      {/* Tab Navigation */}
      <div className="flex border-b-2 border-zinc-800 shrink-0">
        <button
          aria-pressed={activeTab === 'export'}
          className="flex-1 px-4 py-3 font-medium transition border-b-2 border-transparent hover:bg-zinc-800 text-zinc-300 aria-pressed:bg-zinc-800 aria-pressed:border-brand aria-pressed:text-zinc-100"
          onClick={() => setActiveTab('export')}
          type="button"
        >
          {t('importExport.exportTab')}
        </button>
        <button
          aria-pressed={activeTab === 'import'}
          className="flex-1 px-4 py-3 font-medium transition border-b-2 border-transparent hover:bg-zinc-800 text-zinc-300 aria-pressed:bg-zinc-800 aria-pressed:border-brand aria-pressed:text-zinc-100"
          onClick={() => setActiveTab('import')}
          type="button"
        >
          {t('importExport.importTab')}
        </button>
      </div>

      <DialogBody className="space-y-4">
        {activeTab === 'export' ? (
          <>
            <p className="text-sm text-zinc-400 mb-4">
              {t('importExport.exportDescription', { count: censorships.length })}
            </p>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t('importExport.fileFormat')}</label>
            <div className="grid sm:grid-cols-2 gap-2">
              <button
                aria-pressed={exportFormat === 'json'}
                className="p-3 rounded-lg border-2 transition aria-pressed:bg-zinc-700 aria-pressed:border-brand aria-pressed:text-zinc-100 aria-pressed:hover:bg-zinc-700 aria-pressed:hover:text-zinc-300"
                onClick={() => setExportFormat('json')}
                type="button"
              >
                <div className="font-medium">JSON</div>
                <div className="text-xs text-zinc-400">{t('importExport.jsonDescription')}</div>
              </button>
              <button
                aria-pressed={exportFormat === 'csv'}
                className="p-3 rounded-lg border-2 transition aria-pressed:bg-zinc-700 aria-pressed:border-brand aria-pressed:text-zinc-100 aria-pressed:hover:bg-zinc-700 aria-pressed:hover:text-zinc-300"
                onClick={() => setExportFormat('csv')}
                type="button"
              >
                <div className="font-medium">CSV</div>
                <div className="text-xs text-zinc-400">{t('importExport.csvDescription')}</div>
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-400 mb-4">{t('importExport.importDescription')}</p>
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t('importExport.jsonData')}</label>
            <textarea
              className="w-full h-64 px-4 py-2 bg-zinc-800 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 outline-none transition font-mono text-base text-zinc-100 placeholder-zinc-500"
              onChange={(e) => setImportText(e.target.value)}
              placeholder={PLACEHOLDER_JSON}
              value={importText}
            />
          </>
        )}
      </DialogBody>

      <DialogFooter className="border-t-2 border-zinc-800">
        {activeTab === 'export' ? (
          <button
            className="w-full px-4 py-3 text-zinc-900 font-semibold bg-brand hover:bg-brand/90 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition flex items-center justify-center gap-2"
            disabled={censorships.length === 0}
            onClick={handleExport}
            type="button"
          >
            <Download className="size-5" />
            <span>{t('importExport.exportAction')}</span>
          </button>
        ) : (
          <button
            className="w-full px-4 py-3 text-zinc-900 font-semibold bg-brand hover:bg-brand/90 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition flex items-center justify-center gap-2"
            disabled={!importText.trim() || addMutation.isPending}
            onClick={handleImport}
            type="button"
          >
            {addMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                <span>{t('importExport.importing')}</span>
              </>
            ) : (
              <>
                <Upload className="size-5" />
                <span>{t('importExport.importAction')}</span>
              </>
            )}
          </button>
        )}
      </DialogFooter>
    </Dialog>
  )
}

function formatCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}
