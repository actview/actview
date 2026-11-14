# Markdown 功能示例

本页覆盖 P0 / P1 Markdown 能力。

[[toc]]

## 容器

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

### GitHub Alerts

> [!TIP]
> 这是 GitHub 风格的 TIP。

> [!WARNING]
> 这是 GitHub 风格的 WARNING。

## 代码高亮

```ts
interface User {
  name: string
  age: number
}

const user: User = { name: 'ActView', age: 3 }
```

### 行高亮

```ts{2,4-5}
const a = 1
const b = 2
const c = 3
const d = 4
const e = 5
```

### 行号与标题

```ts:line-numbers [example.ts]
const message: string = 'hello'
console.log(message)
```

### 代码组

::: code-group

```ts [app.ts]
const app = createApp()
app.mount('#app')
```

```js [app.js]
const app = createApp()
app.mount('#app')
```

:::

### 复制按钮

每个代码块右上角都有复制按钮。

## 代码片段

<<< ./snippets/example.ts

## Include

<!--@include: ./includes/note.md-->

## TOC

页面开头的 `[[toc]]` 会自动生成目录。

## 属性

## 自定义标题 {#custom-heading .custom-class}

段落也可以加属性。

{ .lead }

## Emoji

:smile: :rocket: :+1:

## 链接与图片

[站内链接](./guide.md)  
[外部链接](https://vitepress.dev)

![示例图片](/example.svg)

## 其他

| 功能 | 状态 |
| --- | --- |
| 表格 | 支持 |
| 删除线 | ~~支持~~ |
