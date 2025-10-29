'use client'

import { CaseSensitive, Filter, Heart, Rabbit } from 'lucide-react'
import { useState } from 'react'

import IconPlus from '@/components/icons/IconPlus'

import type { NotificationCriteria } from './types'

import Onboarding from '../Onboarding'
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
        <Onboarding
          benefits={[
            {
              icon: <Rabbit className="size-5" />,
              title: '실시간 알림',
              description: '새 작품이 올라오면 즉시 알려드려요',
            },
            {
              icon: <Filter className="size-5" />,
              title: '정밀한 필터링',
              description: '원하는 키워드만 정확하게 추적해요',
            },
            {
              icon: <Heart className="size-5" />,
              title: '개인화된 경험',
              description: '취향에 맞는 작품을 편하게 관리해요',
            },
          ]}
          description="관심있는 시리즈와 태그를 놓치지 않도록 알려드릴게요"
          icon={<CaseSensitive className="size-12 text-brand-end" />}
          title="키워드 알림 시작하기"
        >
          <button
            className="px-6 py-3 rounded-2xl bg-brand-end text-background font-semibold hover:opacity-90 transition"
            onClick={handleCreateClick}
            type="button"
          >
            키워드 알림 설정하기
          </button>
        </Onboarding>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-medium text-zinc-200">조건</h2>
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
              <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded bg-zinc-800 text-zinc-400 text-center leading-4 sm:leading-5 text-[10px] sm:text-xs font-medium mr-2 shrink-0">
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
