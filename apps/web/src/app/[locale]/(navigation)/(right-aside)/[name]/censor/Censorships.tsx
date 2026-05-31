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
import { CENSORSHIP_KEY_MESSAGE_PATHS, CENSORSHIP_KEYS } from './constants'
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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4">
      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/75">
        <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t('list.title')}</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">{t('list.description')}</p>
          </div>
          <button
            className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/45 px-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-50 sm:px-3"
            disabled={isLoading || isDeleting}
            onClick={handleOpenImportExportModal}
            title={t('list.importExportAriaLabel')}
            type="button"
          >
            <MoreHorizontal className="size-4 shrink-0" />
            <span className="hidden sm:inline">{t('list.importExportAction')}</span>
          </button>
        </div>
        <div className="border-t border-zinc-800 px-4 py-3 sm:px-5">
          <CensorshipStats censorships={allCensorships} />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/75 p-4 sm:p-5">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-zinc-100">{t('creationBar.title')}</h3>
          <p className="mt-0.5 text-xs leading-5 text-zinc-500">{t('creationBar.description')}</p>
        </div>
        <CensorshipCreationBar />
      </section>

      <DefaultCensorshipInfo />

      <section className="min-h-72 flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/75">
        <div className="border-b border-zinc-800 px-4 py-3 sm:px-5">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{t('list.ruleListTitle')}</h3>
            <p className="mt-0.5 text-xs leading-5 text-zinc-500">
              {searchQuery || filterKey !== null
                ? t('list.filteredRuleListDescription', {
                    count: filteredCensorships.length,
                    total: allCensorships.length,
                  })
                : t('list.ruleListDescription', { count: allCensorships.length })}
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 shrink-0 -translate-y-1/2 text-zinc-500" />
              <input
                aria-label={t('list.searchPlaceholder')}
                className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950/45 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-2 focus:ring-brand/15 disabled:opacity-50"
                disabled={isLoading || isDeleting}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('list.searchPlaceholder')}
                type="text"
                value={searchQuery}
              />
            </div>
            <CustomSelect
              buttonClassName="h-10 border-zinc-800 bg-zinc-950/45 text-sm focus:ring-brand/15"
              className="sm:w-44"
              disabled={isLoading || isDeleting}
              onChange={(value) => setFilterKey(value === '' ? null : Number(value))}
              options={[
                { value: '', label: t('list.allTypes') },
                ...CENSORSHIP_KEYS.map((key) => ({
                  value: String(key),
                  label: t(CENSORSHIP_KEY_MESSAGE_PATHS[key]),
                })),
              ]}
              value={filterKey?.toString() ?? ''}
            />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-col gap-2 border-b border-zinc-800 bg-brand/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="text-sm font-medium text-zinc-200">
              {t('list.selectedCount', { count: selectedIds.size })}
            </span>
            <div className="flex gap-2">
              <button
                className="h-8 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
                disabled={isDeleting}
                onClick={() => setSelectedIds(new Set())}
                type="button"
              >
                {t('list.clearSelection')}
              </button>
              <button
                className="flex h-8 min-w-14 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-medium text-foreground transition hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
                onClick={handleBulkDelete}
                type="button"
              >
                {isDeleting ? <Loader2 className="size-3 shrink-0 animate-spin" /> : t('list.delete')}
              </button>
            </div>
          </div>
        )}

        <div className="min-h-72">
          {isLoading ? (
            <div className="divide-y divide-zinc-800">
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
            <div className="divide-y divide-zinc-800">
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
                <div className="py-2" ref={loadMoreRef}>
                  {isFetchingNextPage ? <CensorshipCardSkeleton /> : <div className="h-1" />}
                </div>
              )}
              {isFetchNextPageError && (
                <LoadMoreRetryButton containerClassName="py-4 flex justify-center" onRetry={fetchNextPage} />
              )}
            </div>
          )}
        </div>
      </section>

      <ImportExportModal
        censorships={allCensorships}
        onClose={handleCloseImportExportModal}
        open={showImportExportModal && !isDeleting}
      />
    </div>
  )
}
