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
        <div className="bg-zinc-900 w-screen max-w-lg max-h-dvh rounded-3xl border border-zinc-800 overflow-auto flex flex-col">
          {/* Header with progress indicator */}
          <div className="p-5 pb-10 border-b border-zinc-800/50">
            <h2 className="text-xl font-bold text-center mb-3 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              북마크 업로드
            </h2>

            {/* Progress indicator */}
            <div className="flex items-center justify-between relative px-4">
              <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-zinc-800 -translate-y-1/2" />
              <div
                className="absolute top-1/2 left-8 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 -translate-y-1/2 transition duration-500 ease-out"
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
                      transition aria-selected:bg-gradient-to-br aria-selected:from-violet-500 aria-selected:to-purple-500 aria-selected:border-transparent aria-selected:text-foreground aria-current:scale-125 aria-current:shadow-lg aria-current:shadow-purple-500/25"
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
                  <div className="w-full max-w-sm mx-auto border-2 border-dashed border-zinc-700/50 rounded-2xl p-8 text-center transition group-hover:border-violet-500/50 group-hover:bg-violet-500/5 group-hover:shadow-lg group-hover:shadow-violet-500/10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center transition duration-300">
                      <IconBookmark className="w-8 h-8 text-violet-400" />
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
                  <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl p-5 border border-violet-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <IconBookmark className="w-6 h-6 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">
                          총 <span className="text-violet-400">{previewData.totalCount.toLocaleString()}</span>개의
                          북마크
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
                    <h3 className="font-semibold text-zinc-200 text-lg">가져오기 방식 선택</h3>
                    <div className="space-y-3">
                      <label
                        aria-current={importMode === 'merge'}
                        className="relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition overflow-hidden
                        aria-current:border-violet-500/50 aria-current:bg-violet-500/10 aria-current:shadow-lg aria-current:shadow-violet-500/10
                        border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30"
                      >
                        {importMode === 'merge' && (
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5" />
                        )}
                        <input
                          checked={importMode === 'merge'}
                          className="mt-1 w-4 h-4 text-violet-500 bg-zinc-800 border-zinc-600"
                          name="importMode"
                          onChange={(e) => setImportMode(e.target.value as ImportMode)}
                          type="radio"
                          value="merge"
                        />
                        <div className="flex-1 relative">
                          <p className="font-semibold mb-1">기존 북마크와 병합</p>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            현재 북마크를 유지하면서 새로운 북마크를 추가합니다
                          </p>
                        </div>
                        {importMode === 'merge' && (
                          <span className="text-xs bg-gradient-to-r from-violet-500 to-purple-500 text-foreground px-3 py-1.5 rounded-full font-medium shadow-md shadow-violet-500/25">
                            권장
                          </span>
                        )}
                      </label>
                      <label
                        aria-current={importMode === 'replace'}
                        className="relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition duration-300
                          aria-current:border-red-500/50 aria-current:bg-red-500/10 aria-current:shadow-lg aria-current:shadow-red-500/10
                          border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30"
                      >
                        {importMode === 'replace' && (
                          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5" />
                        )}
                        <input
                          checked={importMode === 'replace'}
                          className="mt-1 w-4 h-4 text-red-500 bg-zinc-800 border-zinc-600"
                          name="importMode"
                          onChange={(e) => setImportMode(e.target.value as ImportMode)}
                          type="radio"
                          value="replace"
                        />
                        <div className="flex-1 relative">
                          <p className="font-semibold mb-1">모든 북마크 교체</p>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            현재 북마크를 모두 삭제하고 새로운 북마크로 교체합니다
                          </p>
                          {importMode === 'replace' && (
                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                              <p className="text-sm text-red-400 font-medium flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 border-r-purple-500 rounded-full animate-spin" />
                  <IconUpload className="absolute inset-0 m-auto w-10 h-10 text-violet-400" />
                </div>
                <p className="text-zinc-200 font-semibold text-lg mb-2">북마크를 업로드하는 중</p>
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
                        aria-invalid:from-yellow-500/20 aria-invalid:to-orange-500/20 aria-invalid:text-yellow-400 aria-invalid:border-yellow-500/20
                        from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/20"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                      업로드 완료!
                    </h3>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {importResult.imported > 0 && (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                        <span className="font-medium">성공적으로 가져옴</span>
                        <span className="font-bold text-green-400 text-lg">
                          {importResult.imported.toLocaleString()}개
                        </span>
                      </div>
                    )}
                    {importResult.skipped > 0 && (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
                        <span className="font-medium">중복으로 건너뜀</span>
                        <span className="font-bold text-yellow-400 text-lg">
                          {importResult.skipped.toLocaleString()}개
                        </span>
                      </div>
                    )}
                    {importResult.errors.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500/10 to-rose-500/10 rounded-xl border border-red-500/20 cursor-pointer transition hover:bg-red-500/15">
                          <span className="font-medium">오류 발생</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-red-400 text-lg">{importResult.errors.length}개</span>
                            <svg
                              className="w-5 h-5 text-red-400 group-open:rotate-180 transition duration-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                            </svg>
                          </div>
                        </summary>
                        <div className="mt-3 p-4 bg-zinc-800/50 rounded-xl max-h-32 overflow-y-auto">
                          <ul className="space-y-1.5 text-sm">
                            {importResult.errors.map((error, index) => (
                              <li className="flex items-start gap-2 text-red-400/90" key={index}>
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
          <div className="p-6 border-t border-zinc-800/50 bg-zinc-900 font-semibold text-sm">
            {importState === 'idle' && (
              <button
                className="w-full px-6 py-3 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl transition hover:bg-zinc-700/50 hover:border-zinc-600/50"
                onClick={handleClose}
              >
                취소
              </button>
            )}
            {importState === 'preview' && (
              <div className="flex gap-3">
                <button
                  className="flex-1 px-6 py-3 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl transition hover:bg-zinc-700/50 hover:border-zinc-600/50"
                  onClick={handleReset}
                  type="button"
                >
                  뒤로
                </button>
                <button
                  className="flex-1 px-6 py-3 bg-violet-500/10 border-violet-600/50 text-foreground rounded-xl transition border-2 hover:bg-violet-500/20"
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
                  className="flex-1 px-6 py-3 bg-zinc-800/50 border-2 border-zinc-700/50 rounded-xl transition hover:bg-zinc-700/50 hover:border-zinc-600/50"
                  onClick={handleReset}
                  type="button"
                >
                  다른 파일 선택
                </button>
                <button
                  className="flex-1 px-6 py-3 bg-violet-500/10 border-violet-600/50 text-foreground rounded-xl transition border-2 hover:bg-violet-500/20"
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
