import { DEFAULT_SEARCH_LANGUAGE } from '../search/language'

export type UserSettings = {
  historySyncEnabled: boolean
  adultVerifiedAdVisible: boolean
  defaultCensorshipEnabled: boolean
  searchLanguage: string
  autoDeletionDay: number
}

export type UserSettingsPatch = Partial<UserSettings>

export const DEFAULT_USER_SETTINGS: UserSettings = {
  historySyncEnabled: true,
  adultVerifiedAdVisible: false,
  defaultCensorshipEnabled: true,
  searchLanguage: DEFAULT_SEARCH_LANGUAGE,
  autoDeletionDay: 90,
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
    searchLanguage: value?.searchLanguage ?? DEFAULT_USER_SETTINGS.searchLanguage,
    autoDeletionDay: value?.autoDeletionDay ?? DEFAULT_USER_SETTINGS.autoDeletionDay,
  }
}
