export interface TwoFactorSetupData {
  expiresAt: Date
  qrCode: string
  secret: string
}

export interface TwoFactorStatus {
  createdAt?: Date
  lastUsedAt?: Date | null
  remainingBackupCodes: number
  trustedBrowsers?: {
    id: number
    browserName: string | null
    lastUsedAt: Date
    createdAt: Date
    expiresAt: Date
  }[]
}
