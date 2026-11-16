# 本地搜索 {#local-search}

vitepress-actview 使用 MiniSearch 提供本地搜索。

## 启用 {#enable}

```ts
export default {
  themeConfig: {
    search: {
      provider: 'local',
    },
  },
}
```

## 使用 {#usage}

- 点击导航栏的 “Search”
- 按 `Ctrl/Cmd + K`
- 按 `/`

## 索引 {#index}

构建/开发时会扫描所有 Markdown 页面：

1. 渲染 Markdown
2. 按标题切分章节
3. 为每个章节生成 `title / titles / text`
4. 生成当前语言对应的 MiniSearch 索引

搜索结果会保留：

```ts
{
  id: '/guide/routing#routing',
  title: '路由',
  titles: ['指南'],
  text: '...'
}
```

点击结果后通过客户端 router 跳转。

## 高亮 {#highlight}

结果摘要中的关键词会使用 `<mark>` 高亮。

## 当前限制 {#limitations}

- 目前只索引主要语言
- 结果最多显示 16 条
- 摘要来自索引文本，不会动态渲染完整页面 HTML
- 暂不支持 VitePress 的 detailed view 页面模块摘要

相关配置见 [站点配置](/reference/config)。
