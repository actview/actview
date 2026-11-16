# 页面数据 {#page-data}

Markdown 页面会生成一份 page data：

```ts
interface PageData {
  title: string
  relativePath: string
  frontmatter: Record<string, any>
  headers: Header[]
  lastUpdated?: number
}
```

## title {#title}

优先使用 frontmatter 的 `title`，否则从首个 `h1` 推断。

## relativePath {#relative-path}

页面相对于文档根目录的文件路径，例如：

```text
guide/getting-started.md
```

## frontmatter {#frontmatter}

YAML frontmatter 会原样保留。

## headers {#headers}

页面标题列表：

```ts
{
  level: 2,
  title: '快速开始',
  slug: '快速开始',
  link: '#快速开始',
}
```

标题 id 使用可读 Unicode slug，不会进行 URL 编码。

## lastUpdated {#last-updated}

启用 `lastUpdated` 后会写入 Git 时间戳。

## transformPageData {#transform-page-data}

```ts
export default {
  transformPageData(data) {
    return {
      title: 'New title',
    }
  },
}
```

返回值会合并到 page data。详见 [transformPageData](/guide/transform-page-data)。
