# @actview/vitepress

基于 VitePress 源码改造的 ActView 文档站工具。

- 上游基线：`vitepress@2.0.0-alpha.17`（MIT）
- 当前状态：**Phase 1 MVP 已跑通**（Markdown → ActView Page → VNode）
- 迁移方案：[MIGRATION.md](./MIGRATION.md)

## CLI 使用

`playground/vitepress` 是一个标准文档根目录，由默认主题 CLI 启动：

```text
playground/vitepress/
  .vitepress/config.ts
  index.md
  guide.md
```

```bash
pnpm dev:vitepress
# http://localhost:5173
```

CLI：

```bash
actview-press dev <docs-root>
```

当前 CLI 导出：

```json
{
  "bin": {
    "actview-press": "./bin/actview-press.js"
  }
}
```

`playground/vitepress` 不需要写 `main.ts`、`vite.config.ts` 或手动调用
`createDocsApp`；页面、默认主题、Markdown 插件、scoped CSS 都由 CLI 装配。

## Markdown 支持

已接入：

- 容器：`::: tip/info/warning/danger/details`、`code-group`、`v-pre`、`raw`
- GitHub Alerts：`> [!TIP]`
- Shiki 语法高亮、行高亮 `{1,3-5}`、行号 `:line-numbers`
- 代码块标题 `[filename]`、复制按钮、代码组 tab
- `[[toc]]`
- `markdown-it-attrs`：`{#id .class}`
- emoji：`:smile:`
- 标题永久链接
- `<<<` 代码片段、`<!--@include: ...-->`
- 内部 `.md` 链接规范化、外链 `target="_blank"`
- 图片 `loading="lazy"`

示例见 [playground/vitepress/markdown.md](../playground/vitepress/markdown.md)。

## Markdown 中的 ActView 组件

`<script>` 内容会整体提升到生成模块顶部，并保留其中的 import、class 和装饰器：

```md
<script component>
import { ActViewComponent, Component } from 'actview'

@Component({ name: 'Counter' })
class Counter extends ActViewComponent {
  render() {
    return <button>Counter</button>
  }
}
</script>

# Counter 示例

<Counter />
```

支持的组件写法：

- `<script>` / `<script component>` 内的 import 和 class
- 默认导入、命名导入、`as` 别名
- `<Counter />`、`<Counter>children</Counter>`
- 静态属性，例如 `<Counter label="demo" />`

暂不支持：

- `v-if` / `v-for`
- `{{ }}` 插值
- `:prop` 动态绑定
- `@event`
- Vue `<script setup>` 的响应式语义

示例见 [counter.md](../playground/vitepress/counter.md) 和
[counter-inline.md](../playground/vitepress/counter-inline.md)。

Markdown 渲染接口现在是异步的：

```ts
const result = await markdownToActview(source, file)
```

示例：

```text
playground/vitepress/
  docs/index.md
  src/main.ts
  vite.config.ts
```

`vite.config.ts`：

```ts
import { actviewMarkdown } from '@actview/vitepress/plugin'
import jsxScoped from '@10coding/vite-plugin-jsx-scoped'

export default defineConfig({
  plugins: [jsxScoped(), actviewMarkdown()],
  define: { __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production') },
  esbuild: { jsx: 'automatic', jsxImportSource: '@actview/jsx' },
})
```

`main.ts`：

```ts
import { createApp } from 'actview'
import { Layout } from '@actview/vitepress'
import Page from '../docs/index.md'

createApp(Layout, { page: Page }).mount('#app')
```

插件把 `.md` 转成：

```ts
class Page extends ActViewComponent {
  render() {
    return htmlToVNode(PAGE_HTML)
  }
}
```

## Phase 1 支持

- 标准 Markdown 标题 / 段落 / 列表 / 链接 / 引用；
- 代码块（无语法高亮，后续接 shiki）；
- frontmatter；
- 原始 HTML；
- `htmlToVNode(html, { components })` 自定义标签映射。

明确不支持（会报错）：

- `v-if` / `v-for` / `v-html` 等 Vue 指令；
- `{{ }}` 插值；
- `<script setup>`。

## 目录

```text
src/                  上游 VitePress 源码 + ActView 迁移
src/client/           ActView client 入口 / Markdown VNode / 主题 TSX
  index.ts
  markdown/htmlToVNode.ts
  theme-default/Layout.tsx
  theme-default/extract-css/
src/node/             Markdown 编译与 Vite 插件
  markdownToActview.ts
  actviewPlugin.ts
LICENSE.vitepress     上游 MIT 许可证
MIGRATION.md          架构与分阶段迁移方案
```

> Scoped CSS 使用 `@10coding/vite-plugin-jsx-scoped`；样式文件命名为 `*.scoped.css`，
> 导入即触发作用域注入。当前通过 pnpm patch 为 Babel 解析器补上 legacy decorators 支持。

## 下一步

Phase 2：ActView app / data / router / head + 最小主题壳。
