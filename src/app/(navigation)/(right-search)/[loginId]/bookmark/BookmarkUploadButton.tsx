'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { BookmarkExportData } from '@/app/(navigation)/(right-search)/[loginId]/bookmark/constants'
import { ImportMode, ImportResult } from '@/app/api/bookmarks/import/route'
import IconBookmark from '@/components/icons/IconBookmark'
import { IconUpload } from '@/components/icons/IconUpload'
import Modal from '@/components/ui/Modal'
import { QueryKeys } from '@/constants/query'

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

  function handleReset() {
    setImportState('idle')
    setPreviewData(null)
    setImportResult(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getProgressStep = () => {
    switch (importState) {
      case 'complete':
        return 4
      case 'idle':
        return 1
      case 'importing':
        return 3
      case 'preview':
        return 2
      default:
        return 1
    }
  }

  return (
    <>
      <button
        className="flex items-center gap-2 text-sm font-semibold border-2 border-zinc-700 rounded-xl w-fit px-2.5 py-1.5 transition bg-zinc-800/50 
        hover:bg-zinc-700/50 hover:border-zinc-600 active:bg-zinc-800 disabled:text-zinc-500 disabled:bg-zinc-800/30 disabled:border-zinc-800"
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
        <div className="bg-zinc-900 w-screen max-w-lg max-h-dvh rounded-3xl border border-zinc-800/60 overflow-auto flex flex-col shadow-2xl">
          {/* Header with progress indicator */}
          <div className="p-5 pb-10 border-b border-zinc-800/40 bg-gradient-to-b from-zinc-900 to-zinc-900/95">
            <h2 className="text-xl font-bold text-center mb-3 text-foreground">북마크 업로드</h2>

            {/* Progress indicator */}
            <div className="flex items-center justify-between relative px-4">
              <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-zinc-800/60 -translate-y-1/2" />
              <div
                className="absolute top-1/2 left-8 h-0.5 bg-gradient-to-r from-blue-600 to-blue-500 -translate-y-1/2 transition duration-500 ease-out"
                style={{ width: `calc(${((getProgressStep() - 1) / 3) * 100}% * (100% - 4rem) / 100%)` }}
              />
              {['파일 선택', '옵션 설정', '업로드', '완료'].map((label, index) => {
                const step = index + 1
                const isActive = step <= getProgressStep()
                const isCurrent = step === getProgressStep()

                return (
                  <div className="relative z-10 flex flex-col items-center" key={label}>
                    <div
                      aria-current={isCurrent}
                      aria-selected={isActive}
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold bg-zinc-900 border-zinc-700 text-zinc-500
                      transition aria-selected:bg-gradient-to-br aria-selected:from-blue-600 aria-selected:to-blue-500 aria-selected:border-transparent aria-selected:text-foreground aria-current:scale-110 aria-current:shadow-lg aria-current:shadow-blue-500/20"
                    >
                      {step}
                    </div>
                    {isCurrent && (
                      <span className="text-xs mt-3 absolute top-full whitespace-nowrap font-medium text-zinc-300">
                        {label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Content area with fixed height to prevent layout shift */}
          <div className="flex-1 overflow-y-auto py-60 relative ">
            <div
              aria-hidden={importState !== 'idle'}
              className="absolute inset-0 transition duration-500 aria-hidden:opacity-0 aria-hidden:pointer-events-none"
            >
              <div className="flex flex-col h-full p-6">
                <p className="text-sm text-zinc-400 text-center mb-4 leading-relaxed">
                  리토미에서 내보낸 북마크 파일을 선택해주세요
                </p>
                <label className="cursor-pointer flex-1 flex items-center justify-center group">
                  <input
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    type="file"
                  />
                  <div className="w-full max-w-sm mx-auto border-2 border-dashed border-zinc-700/60 rounded-2xl p-8 text-center transition group-hover:border-blue-600/40 group-hover:bg-blue-600/5 group-hover:shadow-lg group-hover:shadow-blue-600/10 group-focus-within:border-blue-600/60 group-focus-within:bg-blue-600/10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-800/80 flex items-center justify-center transition group-hover:from-blue-600/10 group-hover:to-blue-500/10">
                      <IconBookmark className="w-8 h-8 text-zinc-400 transition group-hover:text-blue-400" />
                    </div>
                    <p className="font-semibold text-zinc-200 mb-2 text-lg">파일을 선택하세요</p>
                    <p className="text-sm text-zinc-500">JSON 파일 (최대 1MB)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview state - Import options */}
            <div
              aria-hidden={importState !== 'preview'}
              className="absolute inset-0 transition duration-500 aria-hidden:opacity-0 aria-hidden:pointer-events-none"
            >
              {previewData && (
                <div className="h-fit space-y-6 p-6">
                  <div className="bg-gradient-to-br from-blue-600/10 to-blue-500/5 rounded-2xl p-5 border border-blue-600/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <IconBookmark className="w-6 h-6 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg text-foreground">
                          총 <span className="text-blue-400 font-bold">{previewData.totalCount.toLocaleString()}</span>
                          개의 북마크
                        </p>
                        {previewData.exportedAt && (
                          <p className="text-sm text-zinc-400 mt-0.5">
                            {new Date(previewData.exportedAt).toLocaleDateString('ko-KR')} 내보냄
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground text-lg">가져오기 방식 선택</h3>
                    <div className="space-y-3">
                      <label
                        aria-current={importMode === 'merge'}
                        className="relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition overflow-hidden
                        aria-current:border-blue-600/40 aria-current:bg-blue-600/10 aria-current:shadow-lg aria-current:shadow-blue-600/10
                        border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/30 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900"
                      >
                        {importMode === 'merge' && (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-500/5" />
                        )}
                        <input
                          checked={importMode === 'merge'}
                          className="mt-1 w-4 h-4 text-blue-600 bg-zinc-800 border-zinc-600 focus:outline-none"
                          name="importMode"
                          onChange={(e) => setImportMode(e.target.value as ImportMode)}
                          type="radio"
                          value="merge"
                        />
                        <div className="flex-1 relative">
                          <p className="font-semibold mb-1 text-foreground">기존 북마크와 병합</p>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            현재 북마크를 유지하면서 새로운 북마크를 추가합니다
                          </p>
                        </div>
                        {importMode === 'merge' && (
                          <span className="text-xs bg-gradient-to-r from-blue-600 to-blue-500 text-foreground px-3 py-1.5 rounded-full font-medium shadow-md shadow-blue-600/20">
                            권장
                          </span>
                        )}
                      </label>
                      <label
                        aria-current={importMode === 'replace'}
                        className="relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition
                          aria-current:border-orange-600/40 aria-current:bg-orange-600/10 aria-current:shadow-lg aria-current:shadow-orange-600/10
                          border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/30 focus-within:ring-2 focus-within:ring-orange-500/40 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900"
                      >
                        {importMode === 'replace' && (
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-orange-500/5" />
                        )}
                        <input
                          checked={importMode === 'replace'}
                          className="mt-1 w-4 h-4 text-orange-600 bg-zinc-800 border-zinc-600 focus:outline-none"
                          name="importMode"
                          onChange={(e) => setImportMode(e.target.value as ImportMode)}
                          type="radio"
                          value="replace"
                        />
                        <div className="flex-1 relative">
                          <p className="font-semibold mb-1 text-foreground">모든 북마크 교체</p>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            현재 북마크를 모두 삭제하고 새로운 북마크로 교체합니다
                          </p>
                          {importMode === 'replace' && (
                            <div className="mt-3 p-3 bg-orange-600/10 border border-orange-600/30 rounded-xl">
                              <p className="text-sm text-orange-300 font-medium flex items-center gap-2">
                                <svg
                                  className="w-4 h-4 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                  />
                                </svg>
                                이 작업은 되돌릴 수 없습니다
                              </p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Importing state - Loading */}
            <div
              aria-hidden={importState !== 'importing'}
              className="absolute inset-0 transition duration-500 aria-hidden:opacity-0 aria-hidden:pointer-events-none flex items-center justify-center"
            >
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-zinc-800/40 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-blue-500 rounded-full animate-spin" />
                  <IconUpload className="absolute inset-0 m-auto w-10 h-10 text-blue-400" />
                </div>
                <p className="text-foreground font-semibold text-lg mb-2">북마크를 업로드하는 중</p>
                <p className="text-sm text-zinc-500">잠시만 기다려주세요</p>
              </div>
            </div>

            {/* Complete state - Results */}
            <div
              aria-hidden={importState !== 'complete'}
              className="absolute inset-0 transition duration-500 aria-hidden:opacity-0 aria-hidden:pointer-events-none"
            >
              {importResult && (
                <div className="flex flex-col h-full p-6">
                  <div className="text-center mb-4">
                    <div
                      aria-invalid={importResult.errors.length > 0}
                      className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg transition duration-500 border-2 bg-gradient-to-br
                        aria-invalid:from-amber-600/20 aria-invalid:to-amber-500/10 aria-invalid:text-amber-400 aria-invalid:border-amber-600/30
                        from-emerald-600/20 to-emerald-500/10 text-emerald-400 border-emerald-600/30"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">업로드 완료!</h3>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {importResult.imported > 0 && (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600/10 to-emerald-500/5 rounded-xl border border-emerald-600/20">
                        <span className="font-medium text-zinc-200">성공적으로 가져옴</span>
                        <span className="font-bold text-emerald-400 text-lg">
                          {importResult.imported.toLocaleString()}개
                        </span>
                      </div>
                    )}
                    {importResult.skipped > 0 && (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-600/10 to-amber-500/5 rounded-xl border border-amber-600/20">
                        <span className="font-medium text-zinc-200">중복으로 건너뜀</span>
                        <span className="font-bold text-amber-400 text-lg">
                          {importResult.skipped.toLocaleString()}개
                        </span>
                      </div>
                    )}
                    {importResult.errors.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600/10 to-red-500/5 rounded-xl border border-red-600/20 cursor-pointer transition hover:bg-red-600/15 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900">
                          <span className="font-medium text-zinc-200">오류 발생</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-red-400 text-lg">{importResult.errors.length}개</span>
                            <svg
                              className="w-5 h-5 text-red-400 group-open:rotate-180 transition"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                            </svg>
                          </div>
                        </summary>
                        <div className="mt-3 p-4 bg-zinc-800/30 rounded-xl max-h-32 overflow-y-auto">
                          <ul className="space-y-1.5 text-sm">
                            {importResult.errors.map((error, index) => (
                              <li className="flex items-start gap-2 text-red-300" key={index}>
                                <span className="text-red-500/50 mt-1">•</span>
                                <span className="break-all leading-relaxed">{error}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer with actions */}
          <div className="p-6 border-t border-zinc-800/40 bg-zinc-900/95 font-semibold text-sm">
            {importState === 'idle' && (
              <button
                className="w-full px-6 py-3 bg-zinc-800/40 border-2 border-zinc-700/40 rounded-xl transition hover:bg-zinc-700/40 hover:border-zinc-600/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900 text-zinc-200"
                onClick={handleClose}
              >
                취소
              </button>
            )}
            {importState === 'preview' && (
              <div className="flex gap-3">
                <button
                  className="flex-1 px-6 py-3 bg-zinc-800/40 border-2 border-zinc-700/40 rounded-xl transition hover:bg-zinc-700/40 hover:border-zinc-600/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900 text-zinc-200"
                  onClick={handleReset}
                  type="button"
                >
                  뒤로
                </button>
                <button
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-foreground rounded-xl transition border-2 border-transparent hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleImport}
                  type="button"
                >
                  업로드 시작
                </button>
              </div>
            )}
            {importState === 'importing' && <div className="h-12" />}
            {importState === 'complete' && (
              <div className="flex gap-3">
                <button
                  className="flex-1 px-6 py-3 bg-zinc-800/40 border-2 border-zinc-700/40 rounded-xl transition hover:bg-zinc-700/40 hover:border-zinc-600/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900 text-zinc-200"
                  onClick={handleReset}
                  type="button"
                >
                  다른 파일 선택
                </button>
                <button
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-foreground rounded-xl transition border-2 border-transparent hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900"
                  onClick={handleClose}
                  type="button"
                >
                  완료
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
