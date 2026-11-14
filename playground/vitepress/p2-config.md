# P2 配置示例

## Dead links

当前构建会在 Markdown 转换阶段检查站内链接。指向不存在页面的链接会直接报错：

```md
[不存在的页面](./missing.md)
```

当前文档中的所有站内链接都经过检查。

## Rewrites

`.vitepress/config.ts` 中配置：

```ts
export default {
  rewrites: {
    '/guide': '/old-guide',
  },
}
```

访问 [Old Guide](/old-guide) 时，实际加载的是 `guide.md`。

## Dynamic routes

```ts
export default {
  dynamicRoutes: [
    {
      path: '/dynamic/42',
      file: 'dynamic.md',
    },
  ],
}
```

访问 [Dynamic Route](/dynamic/42) 会加载 `dynamic.md`。

## git lastUpdated

配置：

```ts
export default {
  lastUpdated: true,
}
```

构建器会读取 Git 提交时间，并写入 `pageData.lastUpdated`。页脚会显示
最后更新时间。

## transformPageData

```ts
export default {
  transformPageData(data) {
    if (data.relativePath === 'p2-transform.md') {
      return {
        title: 'Transformed Page Title',
      }
    }
  },
}
```

对应页面：[Transform Page Data](/p2-transform)。

## 自定义 markdown-it 插件

```ts
export default {
  markdown: {
    config(md) {
      // md.use(yourPlugin)
    },
  },
}
```

对应页面：[Custom markdown-it](/p2-custom)。

## Math / CJK

- [Math](/p2-math)
- [CJK](/p2-cjk)
