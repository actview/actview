# Markdown 扩展 {#markdown-extensions}

vitepress-actview 在标准 Markdown 之上提供了文档常用的扩展。

[[toc]]

## 标题锚点 {#header-anchors}

标题会自动生成锚点。鼠标悬停时显示 `#`，点击可以复制当前位置。

自定义 id：

```md
## 自定义标题 {#custom-heading}
```

## 链接 {#links}

站内 `.md` 链接会被转换为路由链接：

```md
[路由](./routing.md)
[组件](./using-components.md)
```

外部链接自动添加 `target="_blank"` 和 `rel="noreferrer"`。

## Frontmatter {#frontmatter}

```yaml
---
title: 页面标题
description: 页面描述
---
```

## 表格 {#tables}

| 功能 | 状态 |
| --- | --- |
| 表格 | 支持 |
| 删除线 | ~~支持~~ |

## Emoji {#emoji}

```md
:smile: :rocket: :+1:
```

输出：:smile: :rocket: :+1:

## 目录 {#toc}

```md
[[toc]]
```

会生成当前页面的目录。

## 容器 {#containers}

::: tip
这是 `tip` 容器。
:::

::: info 自定义标题
这是带自定义标题的 `info` 容器。
:::

::: warning
这是 `warning` 容器。
:::

::: danger
这是 `danger` 容器。
:::

::: details 点击展开
这是 `details` 容器。
:::

### GitHub Alerts {#github-alerts}

> [!TIP]
> 这是 GitHub 风格的 TIP。

> [!WARNING]
> 这是 GitHub 风格的 WARNING。

### code-group {#code-group}

::: code-group

```ts [app.ts]
const app = createApp()
app.mount('#app')
```

```js [app.js]
const app = createApp()
app.mount('#app')
```

<div class="language-html" data-title="HTML">
<pre><code>&lt;div id="app"&gt;&lt;/div&gt;</code></pre>
</div>

:::

## 代码块 {#code-blocks}

### 语法高亮 {#syntax-highlighting}

```ts
interface User {
  name: string
  age: number
}

const user: User = { name: 'ActView', age: 3 }
```

### 行高亮 {#line-highlighting}

```ts{2,4-5}
const a = 1
const b = 2
const c = 3
const d = 4
const e = 5
```

### 行号与标题 {#line-numbers}

```ts:line-numbers [example.ts]
const message: string = 'hello'
console.log(message)
```

### 复制按钮 {#copy-button}

每个代码块右上角都有复制按钮。

## 代码片段 {#snippets}

```md
<<< ../snippets/example.ts
```

<<< ../snippets/example.ts

## Include {#include}

```md
<!--@include: ../includes/note.md-->
```

<!--@include: ../includes/note.md-->

## 属性 {#attributes}

```md
## 自定义标题 {#custom-heading .custom-class}
```

## 自定义标题 {#custom-heading .custom-class}

段落也可以加属性：

```md
段落文本
{ .lead }
```

## 图片 {#images}

![示例图片](/example.svg)
