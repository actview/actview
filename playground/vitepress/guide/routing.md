# 路由 {#routing}

vitepress-actview 使用文件路由，并在客户端使用 SPA 导航。

## 文件路由 {#file-based-routing}

```text
guide/getting-started.md  →  /guide/getting-started
guide/index.md            →  /guide/
index.md                  →  /
```

Markdown 链接会自动去掉 `.md`：

```md
[快速开始](./getting-started.md)
```

## 链接 {#links}

内部链接由主题 router 接管：

```md
[Markdown](./markdown.md)
```

外部链接自动添加：

```html
target="_blank" rel="noreferrer"
```

## Rewrites {#rewrites}

可以在 `.vitepress/config.ts` 中建立别名：

```ts
export default {
  rewrites: {
    '/guide/routing': '/guide/old-routing',
  },
}
```

这样访问 `/guide/old-routing` 会加载 `guide/routing.md`。

## 动态路由 {#dynamic-routes}

显式的动态路径映射：

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

示例页面：[动态路由](/guide/dynamic/42)。

## 构建产物 {#build-output}

`build` 会为每个路由生成 `index.html`，并输出 `404.html`。详见 [CLI](/reference/cli)。
