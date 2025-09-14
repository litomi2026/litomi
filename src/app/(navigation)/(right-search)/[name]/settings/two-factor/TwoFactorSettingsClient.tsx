'use client'

import { useState } from 'react'

import type { TwoFactorSetupData, TwoFactorStatus } from './types'

import TwoFactorBackupCodes from './components/TwoFactorBackupCodes'
import TwoFactorManagement from './components/TwoFactorManagement'
import TwoFactorOnboarding from './components/TwoFactorOnboarding'
import TwoFactorSetup from './components/TwoFactorSetup'

interface Props {
  initialStatus: TwoFactorStatus | null
}

export default function TwoFactorSettingsClient({ initialStatus }: Props) {
  const [status, setStatus] = useState<TwoFactorStatus | null>(initialStatus)
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  if (setupData) {
    function handleSuccess(backupcodes: string[]) {
      setBackupCodes(backupcodes)
      setSetupData(null)
      setStatus(() => ({
        createdAt: new Date(),
        remainingBackupCodes: 10,
        enabled: true,
      }))
    }

    return <TwoFactorSetup onSuccess={handleSuccess} setupData={setupData} />
  }

  if (backupCodes.length > 0) {
    return <TwoFactorBackupCodes backupCodes={backupCodes} onComplete={() => setBackupCodes([])} />
  }

  if (!status?.enabled) {
    return <TwoFactorOnboarding onSuccess={(setupData) => setSetupData(setupData)} />
  }

  return <TwoFactorManagement onBackupCodesChange={setBackupCodes} onStatusChange={setStatus} status={status} />
}
