'use client'

import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { useRef } from 'react'
import { toast } from 'sonner'

import { CompleteStep } from './CompleteStep'
import { FileSelectStep } from './FileSelectStep'
import { FooterActions } from './FooterActions'
import { ImportingStep } from './ImportingStep'
import { PreviewStep } from './PreviewStep'
import { ProgressIndicator, STEP_MAP } from './ProgressIndicator'
import { useBookmarkUploadModalStore } from './store'
import { useBookmarkImport } from './useBookmarkImport'
import { validateBookmarkData, validateFile } from './utils'

export default function BookmarkUploadModal() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { isOpen, setIsOpen } = useBookmarkUploadModalStore()

  const { importMode, importResult, importState, handleFileLoad, performImport, previewData, reset, setImportMode } =
    useBookmarkImport()

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file || !validateFile(file)) {
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        if (typeof e.target?.result !== 'string') {
          return
        }

        const data = JSON.parse(e.target.result)

        if (!validateBookmarkData(data)) {
          toast.warning('잘못된 파일 형식이에요')
          return
        }

        handleFileLoad(data)
      } catch (error) {
        console.error('File parse error:', error)
        toast.warning('파일을 읽을 수 없어요')
      }
    }

    reader.readAsText(file)
  }

  function handleClose() {
    setIsOpen(false)
  }

  function handleAfterClose() {
    reset()

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleReset() {
    reset()

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog
      ariaLabel="북마크 복원"
      className="sm:max-w-lg"
      onAfterClose={handleAfterClose}
      onClose={handleClose}
      open={isOpen}
    >
      <DialogHeader onClose={handleClose} title="북마크 복원" />

      <DialogBody className="p-0 overflow-y-hidden flex flex-col">
        <div className="p-5 pb-10 border-b border-zinc-800/40 bg-linear-to-b from-zinc-900 to-zinc-900/95 shrink-0">
          <ProgressIndicator currentStep={STEP_MAP[importState]?.step || 1} />
        </div>

        <div className="flex-1 overflow-y-auto py-60 relative">
          <FileSelectStep
            fileInputRef={fileInputRef}
            isVisible={importState === 'idle'}
            onFileSelect={handleFileSelect}
          />
          {previewData && (
            <PreviewStep
              importMode={importMode}
              isVisible={importState === 'preview'}
              previewData={previewData}
              setImportMode={setImportMode}
            />
          )}
          <ImportingStep isVisible={importState === 'importing'} />
          {importResult && <CompleteStep importResult={importResult} isVisible={importState === 'complete'} />}
        </div>
      </DialogBody>

      <DialogFooter className="border-zinc-800/40 bg-zinc-900/95 p-6 font-semibold text-sm">
        <FooterActions importState={importState} onClose={handleClose} onImport={performImport} onReset={handleReset} />
      </DialogFooter>
    </Dialog>
  )
}
