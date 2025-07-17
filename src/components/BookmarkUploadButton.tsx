'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { BookmarkExportData } from '@/app/(navigation)/(right-search)/[loginId]/bookmark/constants'
import { ImportMode, ImportResult } from '@/app/api/bookmarks/import/route'
import { QueryKeys } from '@/constants/query'

import IconBookmark from './icons/IconBookmark'
import { IconUpload } from './icons/IconUpload'
import Modal from './ui/Modal'

type ImportState = 'complete' | 'idle' | 'importing' | 'preview'

export default function BookmarkUploadButton() {
  const [isOpened, setIsOpened] = useState(false)
  const [importState, setImportState] = useState<ImportState>('idle')
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [previewData, setPreviewData] = useState<BookmarkExportData | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  function handleButtonClick() {
    setIsOpened(true)
    setImportState('idle')
    setPreviewData(null)
    setImportResult(null)
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (file.type !== 'application/json') {
      toast.error('JSON 파일만 가능해요')
      return
    }

    if (file.size > 1024 * 1024) {
      toast.error('파일 크기는 1MB를 초과할 수 없어요. 북마크가 많다면 파일을 쪼개주세요.')
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        if (typeof e.target?.result !== 'string') {
          return
        }

        const data = JSON.parse(e.target.result) as BookmarkExportData

        if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
          toast.error('잘못된 파일 형식이에요')
          return
        }

        setPreviewData(data)
        setImportState('preview')
      } catch (error) {
        console.error('File parse error:', error)
        toast.error('파일을 읽을 수 없어요')
      }
    }

    reader.readAsText(file)
  }

  async function handleImport() {
    if (!previewData) {
      return
    }

    setImportState('importing')

    try {
      const response = await fetch(`/api/bookmarks/import?mode=${importMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || '업로드 중 오류가 발생했어요')
        setImportState('preview')
        return
      }

      setImportResult(result as ImportResult)
      setImportState('complete')

      await queryClient.invalidateQueries({ queryKey: QueryKeys.bookmarks })

      if (result.errors?.length > 0) {
        toast.warning(`${result.imported}개 업로드 완료 (${result.skipped}개 건너뜀, ${result.errors.length}개 오류)`)
      } else if (result.skipped > 0) {
        toast.success(`${result.imported}개 업로드 완료 (${result.skipped}개 중복)`)
      } else {
        toast.success(`${result.imported}개 북마크를 업로드했어요`)
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('업로드 중 오류가 발생했어요')
      setImportState('preview')
    }
  }

  function handleClose() {
    setIsOpened(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <button
        className="flex items-center gap-2 text-sm font-semibold border-2 rounded-xl w-fit px-2.5 py-1.5 transition hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 disabled:pointer-events-none"
        onClick={handleButtonClick}
        type="button"
      >
        <IconUpload className="w-5" />
        <span className="hidden sm:block">북마크 업로드</span>
      </button>
      <Modal
        className="[@media(pointer:coarse)]:top-12"
        onClose={handleClose}
        open={isOpened}
        showCloseButton
        showDragButton
      >
        <div className="grid gap-5 bg-zinc-900 min-w-3xs sm:min-w-sm rounded-2xl px-4 pb-4 pt-5 border-2">
          <h2 className="text-xl text-center font-bold my-2">북마크 업로드</h2>
          {importState === 'idle' && (
            <>
              <p className="text-sm text-zinc-400 text-center">리토미에서 내보낸 북마크 파일(JSON)을 선택해주세요.</p>
              <label className="cursor-pointer">
                <input
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  type="file"
                />
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-600 transition-colors">
                  <IconBookmark className="w-12 mx-auto mb-3 text-zinc-600" />
                  <p className="text-sm text-zinc-400">클릭하여 파일 선택</p>
                  <p className="text-xs text-zinc-500 mt-1">JSON 파일 (최대 10MB)</p>
                </div>
              </label>
            </>
          )}
          {importState === 'preview' && previewData && (
            <>
              <div className="bg-zinc-800 rounded-lg p-3 text-sm">
                <p>
                  총 <span className="font-bold text-primary">{previewData.totalCount}</span>개의 북마크
                </p>
                {previewData.exportedAt && (
                  <p className="text-xs text-zinc-400 mt-1">
                    내보낸 날짜: {new Date(previewData.exportedAt).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold">가져오기 옵션</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      checked={importMode === 'merge'}
                      className="text-primary"
                      name="importMode"
                      onChange={(e) => setImportMode(e.target.value as ImportMode)}
                      type="radio"
                      value="merge"
                    />
                    <span className="text-sm">기존 북마크와 병합 (권장)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      checked={importMode === 'replace'}
                      className="text-primary"
                      name="importMode"
                      onChange={(e) => setImportMode(e.target.value as ImportMode)}
                      type="radio"
                      value="replace"
                    />
                    <span className="text-sm">모든 북마크 교체</span>
                  </label>
                </div>
                <p aria-hidden={importMode !== 'replace'} className="text-xs text-red-400 mt-1 aria-hidden:opacity-0">
                  ⚠️ 경고: 현재 모든 북마크가 삭제되고 새로운 북마크로 교체됩니다.
                </p>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  className="flex-1 px-4 py-2 text-sm border-2 rounded-lg hover:bg-zinc-800 transition"
                  onClick={() => {
                    setImportState('idle')
                    setPreviewData(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  취소
                </button>
                <button
                  className="flex-1 px-4 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition"
                  onClick={handleImport}
                >
                  업로드
                </button>
              </div>
            </>
          )}

          {importState === 'importing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-zinc-400">북마크를 업로드하는 중...</p>
            </div>
          )}

          {importState === 'complete' && importResult && (
            <>
              <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-bold text-green-400">{importResult.imported}개</span> 가져오기 완료
                </p>
                {importResult.skipped > 0 && (
                  <p className="text-sm">
                    <span className="font-bold text-yellow-400">{importResult.skipped}개</span> 건너뜀 (중복)
                  </p>
                )}
                {importResult.errors.length > 0 && (
                  <div>
                    <p className="text-sm">
                      <span className="font-bold text-red-400">{importResult.errors.length}개</span> 오류
                    </p>
                    <details className="mt-2">
                      <summary className="text-xs text-zinc-400 cursor-pointer">오류 상세 보기</summary>
                      <ul className="mt-2 text-xs text-red-400 max-h-20 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
              </div>
              <button
                className="w-full px-4 py-2 text-sm bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition"
                onClick={handleClose}
              >
                완료
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
