'use client'

import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'

import { CompleteStep } from './CompleteStep'
import { FileSelectStep } from './FileSelectStep'
import { FooterActions } from './FooterActions'
import { ImportingStep } from './ImportingStep'
import { PreviewStep } from './PreviewStep'
import { ProgressIndicator, STEP_MAP } from './ProgressIndicator'
import { useBookmarkImport } from './useBookmarkImport'
import { validateBookmarkData, validateFile } from './utils'

export default function BookmarkUploadButton() {
  const [isOpened, setIsOpened] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { importMode, importResult, importState, handleFileLoad, performImport, previewData, reset, setImportMode } =
    useBookmarkImport()

  function handleButtonClick() {
    setIsOpened(true)
    reset()
  }

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
    setIsOpened(false)
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
    <>
      <button
        className="flex items-center gap-2 text-sm font-semibold border-2 border-zinc-700 rounded-xl w-fit px-2.5 py-1.5 transition bg-zinc-800/50 
        hover:bg-zinc-700/50 hover:border-zinc-600 active:bg-zinc-800 disabled:text-zinc-500 disabled:bg-zinc-800/30 disabled:border-zinc-800"
        onClick={handleButtonClick}
        type="button"
      >
        <Upload className="size-5 shrink-0" />
        <span className="hidden sm:block">북마크 업로드</span>
      </button>
      <Dialog ariaLabel="북마크 업로드" className="sm:max-w-lg" onClose={handleClose} open={isOpened}>
        <DialogHeader onClose={handleClose} title="북마크 업로드" />

        <DialogBody className="p-0 overflow-y-hidden flex flex-col">
          <div className="p-5 pb-10 border-b border-zinc-800/40 bg-linear-to-b from-zinc-900 to-zinc-900/95 shrink-0">
            <ProgressIndicator currentStep={STEP_MAP[importState]?.step || 1} />
          </div>

          {/* Content area with fixed height to prevent layout shift */}
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
          <FooterActions
            importState={importState}
            onClose={handleClose}
            onImport={performImport}
            onReset={handleReset}
          />
        </DialogFooter>
      </Dialog>
    </>
  )
}
