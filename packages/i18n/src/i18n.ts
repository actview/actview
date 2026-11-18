// ============================================================
// @actview/i18n — 运行时
//
//   const i18n = createI18n({ locale: 'en', fallbackLocale: 'zh', messages })
//   createApp(App).use(i18n).mount('#app')
//
// 类组件：
//   @Inject(i18nKey) i18n!: I18n
//   this.i18n.t('hello', { name: 'Ada' })
//
// locale 用 ref 保存，t() 读取 locale，因此 render 会自动追踪 locale 变化。
// ============================================================

import { ref, shallowReactive, type Ref, type ShallowReactive } from '@actview/reactivity'
import { inject, type App, type AppPlugin } from '@actview/core'
import type {
  I18nApi,
  I18nOptions,
  I18nParams,
  LocaleMessageObject,
  LocaleMessageValue,
  LocaleMessages,
} from './types'

export const i18nKey: unique symbol = Symbol.for('actview.i18n')

const PLURAL_KEYS = new Set([
  'zero',
  'one',
  'two',
  'few',
  'many',
  'other',
])

export class I18n implements I18nApi, AppPlugin {
  readonly name = 'i18n'

  private readonly localeRef: Ref<string>
  private readonly messages: ShallowReactive<LocaleMessages>
  private readonly fallbackLocales: string[]
  private readonly missingFn?: (locale: string, key: string) => string
  private readonly listeners = new Set<
    (locale: string, oldLocale: string) => void
  >()

  constructor(options: I18nOptions) {
    if (!options.locale) {
      throw new Error('[actview/i18n] createI18n 需要 locale')
    }
    this.localeRef = ref(options.locale)
    this.messages = shallowReactive(options.messages ?? {})
    this.fallbackLocales =
      typeof options.fallbackLocale === 'string'
        ? [options.fallbackLocale]
        : [...(options.fallbackLocale ?? [])]
    this.missingFn = options.missing
  }

  install(app: App): void {
    app.provide(i18nKey, this)
  }

  get locale(): string {
    return this.localeRef.value
  }

  set locale(value: string) {
    this.setLocale(value)
  }

  get fallbackLocale(): string[] {
    return [...this.fallbackLocales]
  }

  get availableLocales(): string[] {
    return Object.keys(this.messages)
  }

  t(key: string, params?: I18nParams, locale?: string): string {
    const targetLocale = locale ?? this.localeRef.value
    const value = this.resolve(key, targetLocale, params)
    if (value === undefined) {
      return this.missingFn?.(targetLocale, key) ?? key
    }
    return this.format(value, params, targetLocale, key)
  }

  te(key: string, locale?: string): boolean {
    const targetLocale = locale ?? this.localeRef.value
    return this.lookupChain(key, targetLocale) !== undefined
  }

  tm(key: string, locale?: string): LocaleMessageValue | undefined {
    const targetLocale = locale ?? this.localeRef.value
    return this.lookupChain(key, targetLocale)
  }

  setLocale(locale: string): void {
    if (!locale) throw new Error('[actview/i18n] locale 不能为空')
    const old = this.localeRef.value
    if (old === locale) return
    this.localeRef.value = locale
    for (const listener of this.listeners) {
      listener(locale, old)
    }
  }

  setLocaleMessage(locale: string, message: LocaleMessageObject): void {
    this.messages[locale] = message
  }

  getLocaleMessage(locale: string): LocaleMessageObject | undefined {
    return this.messages[locale]
  }

  onLocaleChange(
    listener: (locale: string, oldLocale: string) => void,
  ): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private lookup(locale: string, key: string): LocaleMessageValue | undefined {
    const message = this.messages[locale]
    if (!message) return undefined
    const parts = key.split('.')
    let current: unknown = message
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined
      if (!Object.prototype.hasOwnProperty.call(current, part)) return undefined
      current = (current as Record<string, unknown>)[part]
    }
    return current as LocaleMessageValue | undefined
  }

  private lookupChain(
    key: string,
    locale: string,
  ): LocaleMessageValue | undefined {
    for (const target of this.localeChain(locale)) {
      const value = this.lookup(target, key)
      if (value !== undefined) return value
    }
    return undefined
  }

  private resolve(
    key: string,
    locale: string,
    params?: I18nParams,
  ): LocaleMessageValue | undefined {
    for (const target of this.localeChain(locale)) {
      const value = this.lookup(target, key)
      if (value === undefined) continue
      return selectPlural(value, params, target)
    }
    return undefined
  }

  private localeChain(locale: string): string[] {
    return [...new Set([locale, ...this.fallbackLocales])]
  }

  private format(
    value: LocaleMessageValue,
    params: I18nParams | undefined,
    locale: string,
    key: string,
  ): string {
    if (typeof value === 'function') return value(params)
    if (typeof value === 'string') return interpolate(value, params)
    // 命中对象但不是当前参数可选择的复数分支
    if (isPluralMessage(value) && params && hasCount(params)) {
      const category = pluralCategory(Number(params.count), locale)
      const selected = value[category] ?? value.other ?? value.one
      if (selected !== undefined) return this.format(selected, params, locale, key)
    }
    return key
  }
}

export function createI18n(options: I18nOptions): I18n {
  return new I18n(options)
}

export function useI18n(): I18n {
  const i18n = inject<I18n>(i18nKey)
  if (!i18n) {
    throw new Error(
      '[actview/i18n] 未找到 i18n：请先 app.use(createI18n(...))',
    )
  }
  return i18n
}

function interpolate(message: string, params?: I18nParams): string {
  if (!params) return message
  return message.replace(/\{(\w+)\}/g, (full, key: string) => {
    if (Array.isArray(params)) {
      const index = Number(key)
      return Number.isInteger(index) && index < params.length
        ? String(params[index])
        : full
    }
    return Object.prototype.hasOwnProperty.call(params, key)
      ? String(params[key])
      : full
  })
}

function isPluralMessage(
  value: LocaleMessageValue,
): value is LocaleMessageObject {
  if (typeof value !== 'object' || value == null) return false
  return Object.keys(value).some((key) => PLURAL_KEYS.has(key))
}

function hasCount(params: I18nParams): params is Record<string, unknown> {
  return !Array.isArray(params) && typeof params?.count === 'number'
}

function pluralCategory(count: number, locale: string): string {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.PluralRules === 'function') {
      return new Intl.PluralRules(locale).select(count)
    }
  } catch {
    // invalid locale / environment
  }
  return count === 1 ? 'one' : 'other'
}

function selectPlural(
  value: LocaleMessageValue,
  params: I18nParams | undefined,
  locale: string,
): LocaleMessageValue {
  if (!isPluralMessage(value) || !params || !hasCount(params)) return value
  const category = pluralCategory(Number(params.count), locale)
  return value[category] ?? value.other ?? value.one ?? value
}
