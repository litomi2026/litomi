'use client'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'

import type { BulkTargetLibrary } from './bulkActionTypes'

type Props = {
  ariaLabel: string
  description: string
  emptyMessage: string
  isPending: boolean
  libraries: BulkTargetLibrary[]
  onClose: () => void
  onSelectLibrary: (libraryId: number) => void
  open: boolean
  title: string
}

export default function BulkLibrarySelectDialog({
  ariaLabel,
  description,
  emptyMessage,
  isPending,
  libraries,
  onClose,
  onSelectLibrary,
  open,
  title,
}: Readonly<Props>) {
  return (
    <Dialog ariaLabel={ariaLabel} onClose={onClose} open={open}>
      <DialogHeader onClose={onClose} title={title} />

      <DialogBody>
        <p className="mb-4 text-sm text-zinc-400">{description}</p>
        <div className="space-y-2">
          {libraries.map((library) => (
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg border-2 hover:bg-zinc-800 hover:border-zinc-600 transition text-left disabled:opacity-50"
              disabled={isPending}
              key={library.id}
              onClick={() => onSelectLibrary(library.id)}
              type="button"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: library.color ?? '#3B82F6' }}
              >
                <span className="text-lg">{library.icon || '📚'}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-zinc-100 line-clamp-1 break-all">{library.name}</h3>
                <p className="text-sm text-zinc-400">{library.itemCount}개 작품</p>
              </div>
            </button>
          ))}
        </div>
        {libraries.length === 0 && <p className="py-8 text-center text-zinc-500">{emptyMessage}</p>}
      </DialogBody>

      <DialogFooter className="border-t-2 border-zinc-800">
        <button
          className="ml-auto rounded-lg bg-zinc-800 px-5 py-2 font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50"
          disabled={isPending}
          onClick={onClose}
          type="button"
        >
          취소
        </button>
      </DialogFooter>
    </Dialog>
  )
}
