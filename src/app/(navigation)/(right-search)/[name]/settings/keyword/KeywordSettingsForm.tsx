'use client'

import { Bell, Sparkles } from 'lucide-react'
import { useState } from 'react'

import IconPlus from '@/components/icons/IconPlus'

import type { NotificationCriteria } from './types'

import NotificationCriteriaCard from './NotificationCriteriaCard'
import NotificationCriteriaModal from './NotificationCriteriaModal'

interface Props {
  initialCriteria: NotificationCriteria[]
}

export default function KeywordSettingsForm({ initialCriteria: criteria }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCriteria, setEditingCriteria] = useState<NotificationCriteria | null>(null)

  const handleCreateClick = () => {
    setIsModalOpen(true)
    setEditingCriteria(null)
  }

  const handleEditClick = (criterion: NotificationCriteria) => {
    setIsModalOpen(true)
    setEditingCriteria(criterion)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingCriteria(null)
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {criteria.length === 0 ? (
        <EmptyState onCreateClick={handleCreateClick} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-medium text-zinc-200">키워드 조건</h2>
              <p className="hidden sm:block text-sm text-zinc-500 mt-0.5 sm:mt-1">
                {criteria.length}개의 알림 조건이 활성화되어 있어요
              </p>
            </div>
            <button
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-end/50 focus:ring-offset-2 transition-all self-start sm:self-auto"
              onClick={handleCreateClick}
            >
              <IconPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />새 조건
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:gap-3">
            {criteria.map((criterion) => (
              <NotificationCriteriaCard criterion={criterion} key={criterion.id} onEdit={handleEditClick} />
            ))}
          </div>
          <div className="mt-4 sm:mt-8 rounded-lg sm:rounded-xl bg-zinc-900 border border-zinc-800 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-zinc-400 flex items-start">
              <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded bg-zinc-800 text-zinc-400 text-center leading-4 sm:leading-5 text-[10px] sm:text-xs font-medium mr-2 flex-shrink-0">
                i
              </span>
              <span>
                복수 조건을 설정하면 모든 조건이 일치할 때만 알림을 받아요. 정확한 알림을 위해 구체적인 키워드를
                사용하세요.
              </span>
            </p>
          </div>
        </>
      )}

      <NotificationCriteriaModal editingCriteria={editingCriteria} isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  )
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
      <div className="mb-6 sm:mb-8 relative">
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-brand-end/20 to-brand-end/5 flex items-center justify-center">
          <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-brand-end" />
        </div>
        <div className="absolute -bottom-2 -right-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-zinc-900 border-2 border-background flex items-center justify-center">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-brand-end" />
        </div>
      </div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">알림을 설정해 보세요</h2>
      <p className="text-sm sm:text-base text-zinc-400 max-w-xs sm:max-w-sm mb-6 sm:mb-8">
        좋아하는 시리즈의 새 작품을 놓치지 마세요
      </p>
      <div className="w-full max-w-sm sm:max-w-md space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-brand-end/10 flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-lg">🎯</span>
          </div>
          <div className="text-left">
            <p className="font-medium text-xs sm:text-sm mb-0.5">정확한 매칭</p>
            <p className="text-[11px] sm:text-xs text-zinc-500">시리즈, 캐릭터, 태그로 원하는 작품만 필터링</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-brand-end/10 flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-lg">⚡</span>
          </div>
          <div className="text-left">
            <p className="font-medium text-xs sm:text-sm mb-0.5">즉시 알림</p>
            <p className="text-[11px] sm:text-xs text-zinc-500">새 작품이 추가되면 바로 알려드려요</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-brand-end/10 flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-lg">🎨</span>
          </div>
          <div className="text-left">
            <p className="font-medium text-xs sm:text-sm mb-0.5">다양한 조건</p>
            <p className="text-[11px] sm:text-xs text-zinc-500">복수 조건으로 더 정밀한 알림 설정</p>
          </div>
        </div>
      </div>
      <button
        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-brand-end px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-background hover:bg-brand-end/90 focus:outline-none focus:ring-2 focus:ring-brand-end/50 focus:ring-offset-2 transition-all"
        onClick={onCreateClick}
      >
        <IconPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />첫 알림 만들기
      </button>
    </div>
  )
}
