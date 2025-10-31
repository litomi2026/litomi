import IconBookmark from '@/components/icons/IconBookmark'

import { ImportMode } from './action'
import { ImportModeOption } from './ImportModeOption'
import { BookmarkExportData } from './types'

type Props = {
  importMode: ImportMode
  isVisible: boolean
  previewData: BookmarkExportData
  setImportMode: (mode: ImportMode) => void
}

export function PreviewStep({ importMode, isVisible, previewData, setImportMode }: Readonly<Props>) {
  return (
    <div
      aria-hidden={!isVisible}
      className="absolute inset-0 transition aria-hidden:opacity-0 aria-hidden:pointer-events-none"
    >
      <div className="h-fit space-y-6 p-6">
        <div className="bg-linear-to-br from-blue-600/10 to-blue-500/5 rounded-2xl p-5 border border-blue-600/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-600/20">
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
            <ImportModeOption
              colorScheme="blue"
              currentMode={importMode}
              description="현재 북마크를 유지하면서 새로운 북마크를 추가합니다"
              mode="merge"
              onChange={setImportMode}
              showBadge
              title="기존 북마크와 병합"
            />
            <ImportModeOption
              colorScheme="orange"
              currentMode={importMode}
              description="현재 북마크를 모두 삭제하고 새로운 북마크로 교체합니다"
              mode="replace"
              onChange={setImportMode}
              showWarning
              title="모든 북마크 교체"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
