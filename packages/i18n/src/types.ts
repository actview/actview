// ============================================================
// @actview/i18n — 类型
// ============================================================

export type LocaleMessageValue =
  | string
  | ((params?: Record<string, unknown> | unknown[]) => string)
  | LocaleMessageObject

export interface LocaleMessageObject {
  [key: string]: LocaleMessageValue
}

export type LocaleMessages = Record<string, LocaleMessageObject>

export type I18nParams = Record<string, unknown> | unknown[]

export interface I18nOptions {
  locale: string
  fallbackLocale?: string | string[]
  messages: LocaleMessages
  /** key 在所有 locale / fallback 中都不存在时的返回值（默认返回 key） */
  missing?: (locale: string, key: string) => string
}

export interface I18nApi {
  readonly locale: string
  readonly fallbackLocale: string[]
  readonly availableLocales: string[]

  t(key: string, params?: I18nParams, locale?: string): string
  te(key: string, locale?: string): boolean
  tm(key: string, locale?: string): LocaleMessageValue | undefined

  setLocale(locale: string): void
  setLocaleMessage(locale: string, message: LocaleMessageObject): void
  getLocaleMessage(locale: string): LocaleMessageObject | undefined
  onLocaleChange(
    listener: (locale: string, oldLocale: string) => void,
  ): () => void
}

export type Locale = string
