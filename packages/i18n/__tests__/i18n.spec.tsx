// ============================================================
// @actview/i18n 验收
// ============================================================

import { afterEach, describe, expect, it } from 'vitest'
import {
  ActViewComponent,
  Component,
  Inject,
  Ref,
  Setup,
  createApp,
  nextTick,
} from '@actview/core'
import {
  createI18n,
  i18nKey,
  useI18n,
  type I18n,
} from '../src/index'

function mountRoot(): HTMLElement {
  const root = document.createElement('div')
  document.body.appendChild(root)
  return root
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('@actview/i18n', () => {
  it('插值 / 嵌套 key / fallback / missing', () => {
    const i18n = createI18n({
      locale: 'en',
      fallbackLocale: 'zh',
      messages: {
        en: {
          hello: 'Hello {name}',
          nav: { home: 'Home' },
          apples: { one: '{count} apple', other: '{count} apples' },
        },
        zh: {
          hello: '你好 {name}',
          onlyZh: '只有中文',
        },
      },
    })

    expect(i18n.t('hello', { name: 'Ada' })).toBe('Hello Ada')
    expect(i18n.t('hello', { name: 'Ada' }, 'zh')).toBe('你好 Ada')
    expect(i18n.t('nav.home')).toBe('Home')
    expect(i18n.t('onlyZh')).toBe('只有中文')
    expect(i18n.t('missing.key')).toBe('missing.key')
    expect(i18n.te('hello')).toBe(true)
    expect(i18n.te('onlyZh')).toBe(true)
    expect(i18n.tm('nav.home')).toBe('Home')
  })

  it('复数 / 数组参数', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {
          apples: { one: '{count} apple', other: '{count} apples' },
          pair: 'first={0}, second={1}',
        },
      },
    })

    expect(i18n.t('apples', { count: 1 })).toBe('1 apple')
    expect(i18n.t('apples', { count: 2 })).toBe('2 apples')
    expect(i18n.t('pair', ['a', 'b'])).toBe('first=a, second=b')
  })

  it('locale 变化触发组件重渲染', async () => {
    @Component({ name: 'App' })
    class App extends ActViewComponent {
      @Inject(i18nKey)
      i18n!: I18n

      render() {
        return <span>{this.i18n.t('hello', { name: 'Ada' })}</span>
      }
    }

    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: { hello: 'Hello {name}' },
        zh: { hello: '你好 {name}' },
      },
    })

    const root = mountRoot()
    createApp(App).use(i18n).mount(root)
    await nextTick()
    expect(root.textContent).toBe('Hello Ada')

    i18n.setLocale('zh')
    await nextTick()
    expect(root.textContent).toBe('你好 Ada')
  })

  it('useI18n 在 setup 中读取；setLocaleMessage 可响应', async () => {
    @Component({ name: 'App' })
    class App extends ActViewComponent {
      @Ref
      label = ''

      @Setup
      setup(): void {
        this.label = useI18n().t('hello')
      }

      render() {
        return <span>{this.label}</span>
      }
    }

    const i18n = createI18n({
      locale: 'en',
      messages: { en: { hello: 'one' } },
    })

    const root = mountRoot()
    createApp(App).use(i18n).mount(root)
    await nextTick()
    expect(root.textContent).toBe('one')

    i18n.setLocaleMessage('en', { hello: 'two' })
    // label 是 setup 时快照，不会自动改写；验证 setLocaleMessage 本身
    expect(i18n.t('hello')).toBe('two')
  })

  it('onLocaleChange / missing 回调', () => {
    const calls: string[] = []
    const missing: string[] = []
    const i18n = createI18n({
      locale: 'en',
      messages: { en: {} },
      missing: (locale, key) => {
        missing.push(`${locale}:${key}`)
        return `[${locale}]${key}`
      },
    })
    const off = i18n.onLocaleChange((locale, oldLocale) => {
      calls.push(`${oldLocale}->${locale}`)
    })

    expect(i18n.t('nope')).toBe('[en]nope')
    expect(missing).toEqual(['en:nope'])

    i18n.setLocale('zh')
    i18n.setLocale('zh')
    expect(calls).toEqual(['en->zh'])
    expect(i18n.locale).toBe('zh')
    off()
  })

  it('availableLocales / 函数 message', () => {
    const i18n = createI18n({
      locale: 'en',
      messages: {
        en: {
          count: (params) => `count=${(params as Record<string, unknown>).n}`,
        },
        zh: {},
      },
    })
    expect(i18n.availableLocales.sort()).toEqual(['en', 'zh'])
    expect(i18n.t('count', { n: 3 })).toBe('count=3')
  })
})
