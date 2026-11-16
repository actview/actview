# transformPageData {#transform-page-data}

`transformPageData` 可以在 Markdown 转成页面数据之后修改标题、frontmatter 等内容。

## 配置 {#config}

```ts
export default {
  transformPageData(data) {
    if (data.relativePath === 'guide/transform-page-data.md') {
      return {
        title: 'Transformed Page Title',
        frontmatter: {
          ...data.frontmatter,
          transformed: true,
        },
      }
    }
  },
}
```

## 当前页面 {#current-page}

这个页面的标题被配置为 `Transformed Page Title`，frontmatter 中增加了 `transformed: true`。

更多字段见 [页面数据](/reference/page-data)。
