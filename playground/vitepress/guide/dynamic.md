# 动态路由页面 {#dynamic-route}

这个页面通过 `.vitepress/config.ts` 中的 `dynamicRoutes` 映射到 `/guide/dynamic/42`。

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

它证明一个 Markdown 文件可以在显式配置的路径下访问。

返回 [路由](/guide/routing)。
