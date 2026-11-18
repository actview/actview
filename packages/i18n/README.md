# @actview/i18n

ActView 国际化插件：locale / messages / 插值 / 复数 / fallback / 响应式切换。

## 使用

```tsx
import { createApp } from 'actview'
import { createI18n } from '@actview/i18n'

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
      nav: { home: '首页' },
    },
  },
})

createApp(App).use(i18n).mount('#app')
```

类组件使用：

```tsx
import { ActViewComponent, Component, Inject } from 'actview'
import { i18nKey, type I18n } from '@actview/i18n'

@Component
class App extends ActViewComponent {
  @Inject(i18nKey)
  i18n!: I18n

  render() {
    return <span>{this.i18n.t('hello', { name: 'Ada' })}</span>
  }
}
```

`@Setup` 中也能用：

```tsx
@Setup
setup() {
  this.title = useI18n().t('nav.home')
}
```

## API

| API | 说明 |
|---|---|
| `createI18n(options)` | 创建 I18n 实例（也是 App 插件） |
| `i18nKey` | 注入 key |
| `useI18n()` | setup 内获取当前 i18n |
| `i18n.t(key, params?, locale?)` | 翻译 + 插值 + 复数 |
| `i18n.te(key, locale?)` | key 是否存在（含 fallback） |
| `i18n.tm(key, locale?)` | 原始 message |
| `i18n.setLocale(locale)` / `i18n.locale` | 切换 locale（响应式） |
| `i18n.setLocaleMessage(locale, messages)` | 动态写入语言包 |
| `i18n.getLocaleMessage(locale)` | 读取语言包 |
| `i18n.availableLocales` | 已加载语言 |
| `i18n.onLocaleChange(fn)` | 监听 locale 变化 |

## message 规则

- 嵌套 key 用 `.`：`nav.home`；
- 插值：`hello: 'Hello {name}'` + `{ name }`；
- 数组参数：`'{0}-{1}'` + `['a','b']`；
- 复数：`{ one: '...', other: '...' }` + `{ count }`，使用 `Intl.PluralRules`；
- 缺失：依次查 locale → fallbackLocale，仍缺失返回 key；可配置 `missing(locale,key)`；
- message 也可以是函数 `(params) => string`。

## v1 限制

- 无异步语言包加载 / lazy locale；
- 无 `v-t` 指令 / 全局 `$t` 属性；
- 无日期/数字 formatter；
- 无 SSR 序列化 / hydration 协作；
- 无 message compiler / 预编译缓存。
