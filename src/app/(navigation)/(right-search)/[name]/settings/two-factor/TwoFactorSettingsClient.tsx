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
    return (
      <TwoFactorSetup
        onSuccess={(backupcodes) => {
          setBackupCodes(backupcodes)
          setSetupData(null)
        }}
        setupData={setupData}
      />
    )
  }

  if (backupCodes.length > 0) {
    return (
      <TwoFactorBackupCodes
        backupCodes={backupCodes}
        onComplete={() => {
          setBackupCodes([])
          setStatus({
            createdAt: new Date(),
            remainingBackupCodes: backupCodes.length,
          })
        }}
      />
    )
  }

  if (!status) {
    return <TwoFactorOnboarding onSuccess={(setupData) => setSetupData(setupData)} />
  }

  return <TwoFactorManagement onBackupCodesChange={setBackupCodes} onStatusChange={setStatus} status={status} />
}
