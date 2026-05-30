'use client'

import type { DELETEV1CensorshipDeleteResponse } from '@litomi/contracts'

import { CensorshipKey } from '@litomi/domain/censorship/model'
import { env } from '@litomi/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Filter, Loader2, MoreHorizontal, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import AdultVerificationGate from '@/components/AdultVerificationGate'
import StatusState from '@/components/status/StatusState'
import CustomSelect from '@/components/ui/CustomSelect'
import LoadMoreRetryButton from '@/components/ui/LoadMoreRetryButton'
import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import { QueryKeys } from '@/lib/react-query/query-keys'
import useCensorshipsInfiniteQuery from '@/query/useCensorshipInfiniteQuery'
import { fetchAPIData } from '@/utils/api-request'

import CensorshipCard, { CensorshipCardSkeleton } from './CensorshipCard'
import CensorshipCreationBar from './CensorshipCreationBar'
import CensorshipStats from './CensorshipStats'
import { CENSORSHIP_KEY_ORDER, getCensorshipKeyMessagePath } from './constants'
import DefaultCensorshipInfo from './DefaultCensorshipInfo'

const { NEXT_PUBLIC_API_ORIGIN } = env

const ImportExportModal = dynamic(() => import('./ImportExportModal'))

export default function Censorships() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set<number>())
  const [deletingIds, setDeletingIds] = useState(new Set<number>())
  const [showImportExportModal, setShowImportExportModal] = useState(false)
  const [filterKey, setFilterKey] = useState<CensorshipKey | null>(null)
  const queryClient = useQueryClient()
  const t = useTranslations('Censorship')
  const { canAccess, guardAdultAccess, me } = useAdultAccessGuard()

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } =
    useCensorshipsInfiniteQuery()

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const url = new URL('/api/v1/censorship', NEXT_PUBLIC_API_ORIGIN)

      const { data } = await fetchAPIData<DELETEV1CensorshipDeleteResponse>(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids }),
      })

      return data.ids
    },

    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.censorship })
      toast.success(t('list.deleteSuccessToast', { count: ids.length }))
      setSelectedIds(new Set())
      setDeletingIds(new Set())
    },

    onError: () => {
      setDeletingIds(new Set())
    },
  })

  const canAutoLoadMore = Boolean(hasNextPage) && !isFetchNextPageError
  const allCensorships = useMemo(() => data?.pages.flatMap((page) => page.censorships) ?? [], [data])
  const isDeleting = deleteMutation.isPending || deletingIds.size > 0

  const loadMoreRef = useInfiniteScrollObserver({
    hasNextPage: canAutoLoadMore,
    isFetchingNextPage,
    fetchNextPage,
  })

  const filteredCensorships = useMemo(() => {
    return allCensorships.filter((censorship) => {
      const matchesSearch = censorship.value.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterKey === null || censorship.key === filterKey
      return matchesSearch && matchesFilter
    })
  }, [allCensorships, searchQuery, filterKey])

  function handleCloseImportExportModal() {
    setShowImportExportModal(false)
  }

  function handleOpenImportExportModal() {
    if (!guardAdultAccess()) {
      return
    }

    setShowImportExportModal(true)
  }

  function handleToggleSelect(id: number) {
    const newSelectedIds = new Set(selectedIds)

    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id)
    } else {
      newSelectedIds.add(id)
    }

    setSelectedIds(newSelectedIds)
  }

  function handleBulkDelete() {
    if (!guardAdultAccess()) {
      return
    }
    if (selectedIds.size === 0) {
      return
    }

    setDeletingIds(new Set(selectedIds))
    deleteMutation.mutate(Array.from(selectedIds))
  }

  if (me && !canAccess) {
    return (
      <AdultVerificationGate
        description={t('list.adultGateDescription')}
        title={t('list.adultGateTitle')}
        username={me.name}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Header - Always visible to prevent layout shift */}
      <div className="border-b-2">
        <div className="p-3 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t('list.title')}</h2>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition border-2 disabled:opacity-50"
                disabled={isLoading || isDeleting}
                onClick={handleOpenImportExportModal}
                title={t('list.importExportAriaLabel')}
              >
                <MoreHorizontal className="size-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* Quick Add Bar - Primary way to add censorships */}
          <CensorshipCreationBar />

          {/* Search and Filter - Always visible */}
          <div className="flex gap-2 my-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 shrink-0 text-zinc-400" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 rounded-lg border-2 focus:border-zinc-600 outline-none transition disabled:opacity-50"
                disabled={isLoading || isDeleting}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('list.searchPlaceholder')}
                type="text"
                value={searchQuery}
              />
            </div>
            <CustomSelect
              className="w-40"
              disabled={isLoading || isDeleting}
              onChange={(value) => setFilterKey(value === '' ? null : Number(value))}
              options={[
                { value: '', label: t('list.allTypes') },
                ...CENSORSHIP_KEY_ORDER.map((key) => ({
                  value: String(key),
                  label: t(getCensorshipKeyMessagePath(key)),
                })),
              ]}
              value={filterKey?.toString() ?? ''}
            />
          </div>

          {/* Selection Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg mb-4">
              <span className="text-sm">{t('list.selectedCount', { count: selectedIds.size })}</span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition disabled:opacity-50"
                  disabled={isDeleting}
                  onClick={() => setSelectedIds(new Set())}
                >
                  {t('list.clearSelection')}
                </button>
                <button
                  className="px-3 min-w-12 py-1 text-sm bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isDeleting}
                  onClick={handleBulkDelete}
                >
                  {isDeleting ? <Loader2 className="size-3 shrink-0 animate-spin" /> : t('list.delete')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <CensorshipStats censorships={allCensorships} />
      </div>

      <DefaultCensorshipInfo />

      <div className="flex-1 px-4 pb-4 min-h-72">
        {isLoading ? (
          <div className="grid gap-3">
            <CensorshipCardSkeleton />
            <CensorshipCardSkeleton />
            <CensorshipCardSkeleton />
          </div>
        ) : filteredCensorships.length === 0 ? (
          <StatusState
            className="min-h-72 py-10"
            description={
              searchQuery || filterKey !== null ? t('list.emptySearchDescription') : t('list.emptyDescription')
            }
            icon={<Filter className="size-8" />}
            title={searchQuery || filterKey !== null ? t('list.emptySearchTitle') : t('list.emptyTitle')}
          />
        ) : (
          <div className="grid gap-3">
            {filteredCensorships.map((censorship) => (
              <CensorshipCard
                censorship={censorship}
                isDeleting={deletingIds.has(censorship.id)}
                isSelected={selectedIds.has(censorship.id)}
                key={censorship.id}
                onToggleSelect={() => {
                  if (!isDeleting) {
                    handleToggleSelect(censorship.id)
                  }
                }}
              />
            ))}
            {canAutoLoadMore && (
              <div className="py-4" ref={loadMoreRef}>
                {isFetchingNextPage ? <CensorshipCardSkeleton /> : <div className="h-1" />}
              </div>
            )}
            {isFetchNextPageError && (
              <LoadMoreRetryButton containerClassName="py-4 flex justify-center" onRetry={fetchNextPage} />
            )}
          </div>
        )}
      </div>

      <ImportExportModal
        censorships={allCensorships}
        onClose={handleCloseImportExportModal}
        open={showImportExportModal && !isDeleting}
      />
    </div>
  )
}
