'use client'

import dayjs from 'dayjs'
import { X } from 'lucide-react'
import { useState } from 'react'

export default function MaintenanceBanner() {
  const [isVisible, setIsVisible] = useState(true)

  const maintenanceStartTime = new Date('2025-09-21T06:00:00+09:00')
  const maintenanceEndTime = new Date('2025-09-21T07:00:00+09:00')
  const now = new Date()

  if (now > maintenanceEndTime) {
    return null
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-0 bottom-auto z-50 max-w-screen-2xl bg-background mx-auto border-b border-yellow-600/30">
      <div className="flex items-center justify-between px-4 py-3 bg-yellow-900/20 sm:px-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="shrink-0">
            <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-100">데이터베이스 점검 안내</p>
            <p className="text-xs text-yellow-200/80 mt-0.5">
              {dayjs(maintenanceStartTime).format('YYYY-MM-DD HH:mm')} ~ {dayjs(maintenanceEndTime).format('HH:mm')}{' '}
              최소 1시간 이상 회원 관련 서비스 이용이 일시적으로 제한될 수 있어요.
            </p>
          </div>
        </div>
        <button
          aria-label="공지 닫기"
          className="ml-4 shrink-0 p-1 rounded-md hover:bg-yellow-600/20 transition-colors"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4 text-yellow-500" />
        </button>
      </div>
    </div>
  )
}
