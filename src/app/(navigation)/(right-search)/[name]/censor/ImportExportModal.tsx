'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Download, X } from 'lucide-react'
import { memo, useState } from 'react'
import { toast } from 'sonner'

import { CensorshipItem } from '@/backend/api/v1/censorship'
import { IconUpload } from '@/components/icons/IconUpload'
import Modal from '@/components/ui/Modal'
import { QueryKeys } from '@/constants/query'
import useServerAction from '@/hook/useServerAction'
import { downloadBlob } from '@/utils/download'

import { addCensorships } from './action'
import { CENSORSHIP_KEY_LABELS, CENSORSHIP_LEVEL_LABELS } from './constants'

const PLACEHOLDER_JSON = `[
  {
    "key": 0,
    "value": "example_tag",
    "level": 0
  }
]`

type ExportFormat = 'csv' | 'json'

type Props = {
  open: boolean
  onClose: () => void
  censorships: CensorshipItem[]
}

type Tab = 'export' | 'import'

export default memo(ImportExportModal)

function ImportExportModal({ open, onClose, censorships }: Readonly<Props>) {
  const [activeTab, setActiveTab] = useState<Tab>('export')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const [importText, setImportText] = useState('')
  const queryClient = useQueryClient()

  const [_, dispatchAddAction, isPending] = useServerAction({
    action: addCensorships,
    onSuccess: (items) => {
      toast.success(`${items?.length ?? 0}개 규칙을 추가했어요`)
      setImportText('')
      onClose()
      queryClient.invalidateQueries({ queryKey: QueryKeys.censorship })
    },
  })

  const handleExport = () => {
    try {
      let content: string
      let filename: string
      let mimeType: string

      if (exportFormat === 'json') {
        const exportData = censorships.map((c) => ({
          key: c.key,
          keyLabel: CENSORSHIP_KEY_LABELS[c.key],
          value: c.value,
          level: c.level,
          levelLabel: CENSORSHIP_LEVEL_LABELS[c.level].label,
        }))
        content = JSON.stringify(exportData, null, 2)
        filename = 'censorship-rules.json'
        mimeType = 'application/json'
      } else {
        const headers = ['유형', '값', '수준']
        const rows = censorships.map((c) => [
          CENSORSHIP_KEY_LABELS[c.key],
          c.value,
          CENSORSHIP_LEVEL_LABELS[c.level].label,
        ])
        const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join(
          '\n',
        )
        content = csvContent
        filename = 'censorship-rules.csv'
        mimeType = 'text/csv'
      }

      const blob = new Blob([content], { type: mimeType })
      downloadBlob(blob, filename)
      toast.success(`${censorships.length}개 규칙을 내보냈어요`)
      onClose()
    } catch {
      toast.error('내보내기에 실패했어요')
    }
  }

  const handleImport = () => {
    try {
      const data = JSON.parse(importText)

      if (!Array.isArray(data)) {
        throw new Error('Invalid format')
      }

      const formData = new FormData()

      data.forEach((item) => {
        // Find key by label or use direct key
        let key = item.key
        if (typeof key === 'string') {
          const keyEntry = Object.entries(CENSORSHIP_KEY_LABELS).find(([_, label]) => label === key)
          if (keyEntry) {
            key = Number(keyEntry[0])
          }
        }

        // Find level by label or use direct level
        let level = item.level
        if (typeof level === 'string') {
          const levelEntry = Object.entries(CENSORSHIP_LEVEL_LABELS).find(([_, { label }]) => label === level)
          if (levelEntry) {
            level = Number(levelEntry[0])
          }
        }

        if (typeof key === 'number' && item.value && typeof level === 'number') {
          formData.append('key', key.toString())
          formData.append('value', item.value)
          formData.append('level', level.toString())
        }
      })

      dispatchAddAction(formData)
    } catch {
      toast.warning('올바른 JSON 형식이 아니에요')
    }
  }

  return (
    <Modal
      className="fixed inset-0 z-70 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
        sm:w-full sm:max-w-2xl sm:max-h-[calc(100dvh-4rem)] 
        bg-zinc-900 sm:border-2 sm:border-zinc-700 sm:rounded-xl flex flex-col overflow-hidden"
      onClose={onClose}
      open={open}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b-2 border-zinc-800 shrink-0">
          <h2 className="text-xl font-bold text-zinc-100">규칙 가져오기/내보내기</h2>
          <button
            className="p-2 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
            disabled={isPending}
            onClick={onClose}
            type="button"
          >
            <X className="w-5 text-zinc-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-zinc-800 shrink-0">
          <button
            aria-pressed={activeTab === 'export'}
            className="flex-1 px-4 py-3 font-medium transition border-b-2 border-transparent hover:bg-zinc-800 text-zinc-300 aria-pressed:bg-zinc-800 aria-pressed:border-brand aria-pressed:text-zinc-100"
            onClick={() => setActiveTab('export')}
            type="button"
          >
            내보내기
          </button>
          <button
            aria-pressed={activeTab === 'import'}
            className="flex-1 px-4 py-3 font-medium transition border-b-2 border-transparent hover:bg-zinc-800 text-zinc-300 aria-pressed:bg-zinc-800 aria-pressed:border-brand aria-pressed:text-zinc-100"
            onClick={() => setActiveTab('import')}
            type="button"
          >
            가져오기
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
            {activeTab === 'export' ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-4">
                    현재 {censorships.length}개의 검열 규칙을 파일로 내보낼 수 있어요
                  </p>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">파일 형식</label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <button
                      aria-pressed={exportFormat === 'json'}
                      className="p-3 rounded-lg border-2 transition aria-pressed:bg-zinc-700 aria-pressed:border-brand aria-pressed:text-zinc-100 aria-pressed:hover:bg-zinc-700 aria-pressed:hover:text-zinc-300"
                      onClick={() => setExportFormat('json')}
                    >
                      <div className="font-medium">JSON</div>
                      <div className="text-xs text-zinc-400">프로그램 간 호환용</div>
                    </button>
                    <button
                      aria-pressed={exportFormat === 'csv'}
                      className="p-3 rounded-lg border-2 transition aria-pressed:bg-zinc-700 aria-pressed:border-brand aria-pressed:text-zinc-100 aria-pressed:hover:bg-zinc-700 aria-pressed:hover:text-zinc-300"
                      onClick={() => setExportFormat('csv')}
                    >
                      <div className="font-medium">CSV</div>
                      <div className="text-xs text-zinc-400">엑셀 편집용</div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-4">JSON 형식의 검열 규칙을 붙여넣어 가져올 수 있어요</p>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">JSON 데이터</label>
                  <textarea
                    className="w-full h-64 px-4 py-2 bg-zinc-800 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 outline-none transition font-mono text-sm text-zinc-100 placeholder-zinc-500"
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={PLACEHOLDER_JSON}
                    value={importText}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-zinc-900 border-t-2 border-zinc-800 shrink-0">
          {activeTab === 'export' ? (
            <button
              className="w-full px-4 py-3 text-zinc-900 font-semibold bg-brand hover:bg-brand/90 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition flex items-center justify-center gap-2"
              disabled={censorships.length === 0}
              onClick={handleExport}
            >
              <Download className="size-5" />
              <span>내보내기</span>
            </button>
          ) : (
            <button
              className="w-full px-4 py-3 text-zinc-900 font-semibold bg-brand hover:bg-brand/90 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg transition flex items-center justify-center gap-2"
              disabled={!importText.trim() || isPending}
              onClick={handleImport}
              type="button"
            >
              {isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  <span>가져오는 중...</span>
                </>
              ) : (
                <>
                  <IconUpload className="w-5 h-5" />
                  <span>가져오기</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
