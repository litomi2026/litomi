export type UserSettings = {
  historySyncEnabled: boolean
  adultVerifiedAdVisible: boolean
  autoDeletionDay: number
}

export type UserSettingsPatch = Partial<UserSettings>

export const DEFAULT_USER_SETTINGS: UserSettings = {
  historySyncEnabled: true,
  adultVerifiedAdVisible: false,
  autoDeletionDay: 180,
}

export type UserSettingsSignal = {
  userId: number
  settings: UserSettings
  at: number
}

export function patchUserSettings(current: UserSettings | null | undefined, patch: UserSettingsPatch): UserSettings {
  return {
    ...resolveUserSettings(current),
    ...patch,
  }
}

export function resolveUserSettings(value?: Partial<UserSettings> | null): UserSettings {
  return {
    historySyncEnabled: value?.historySyncEnabled ?? DEFAULT_USER_SETTINGS.historySyncEnabled,
    adultVerifiedAdVisible: value?.adultVerifiedAdVisible ?? DEFAULT_USER_SETTINGS.adultVerifiedAdVisible,
    autoDeletionDay: value?.autoDeletionDay ?? DEFAULT_USER_SETTINGS.autoDeletionDay,
  }
}
