export type UserSettings = {
  historySyncEnabled: boolean
  adultVerifiedAdVisible: boolean
  defaultCensorshipEnabled: boolean
  autoDeletionDay: number
}

export type UserSettingsPatch = Partial<UserSettings>

export const DEFAULT_USER_SETTINGS: UserSettings = {
  historySyncEnabled: true,
  adultVerifiedAdVisible: false,
  defaultCensorshipEnabled: true,
  autoDeletionDay: 90,
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
    defaultCensorshipEnabled: value?.defaultCensorshipEnabled ?? DEFAULT_USER_SETTINGS.defaultCensorshipEnabled,
    autoDeletionDay: value?.autoDeletionDay ?? DEFAULT_USER_SETTINGS.autoDeletionDay,
  }
}
