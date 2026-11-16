# 站点配置 {#site-config}

站点配置位于：

```text
.vitepress/config.ts
```

## 基础字段 {#basic}

```ts
export default {
  title: 'ActView Docs',
  description: 'ActView 文档',
  lastUpdated: true,
}
```

## 路由字段 {#routing}

### rewrites {#rewrites}

```ts
export default {
  rewrites: {
    '/guide/routing': '/guide/old-routing',
  },
}
```

### dynamicRoutes {#dynamic-routes}

```ts
export default {
  dynamicRoutes: [
    {
      path: '/guide/dynamic/42',
      file: 'guide/dynamic.md',
    },
  ],
}
```

### ignoreDeadLinks {#ignore-dead-links}

```ts
export default {
  ignoreDeadLinks: true,
}
```

也可以传数组或函数，见 [路由](/guide/routing)。

## 页面数据 {#page-data}

```ts
export default {
  transformPageData(data) {
    return {
      title: data.title,
    }
  },
}
```

详见 [页面数据](/reference/page-data)。

## Markdown {#markdown}

```ts
export default {
  markdown: {
    config(md) {
      // md.use(plugin)
    },
  },
}
```

详见 [Markdown 扩展](/guide/markdown) 和 [自定义 markdown-it](/guide/custom-markdown)。
