export interface TwoFactorSetupData {
  expiresAt: Date
  qrCode: string
  secret: string
}

export interface TwoFactorStatus {
  createdAt?: Date
  enabled: boolean
  lastUsedAt?: Date | null
  remainingBackupCodes: number
}
