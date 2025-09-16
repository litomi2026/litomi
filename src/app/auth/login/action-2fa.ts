import { ok } from '@/utils/action-response'

export async function verifyTwoFactorLogin(formData: FormData) {
  return ok({
    isBackupCodeUsed: false,
    remainingBackupCodes: 0,
    id: 0,
    loginId: '',
    name: '',
    lastLoginAt: null,
    lastLogoutAt: null,
  })
}
