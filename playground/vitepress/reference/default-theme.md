# 默认主题 {#default-theme}

默认主题提供：

- 导航栏
- 侧边栏
- 页脚
- 页面目录
- 代码复制
- 代码组 tab
- 上一篇 / 下一篇位置
- 浅色 / 深色主题切换

## themeConfig {#theme-config}

```ts
export default {
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/what-is-vitepress-actview' },
    ],
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
        ],
      },
    ],
    outlineTitle: '页面导航',
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },
}
```

## 页脚 {#footer}

```ts
export default {
  themeConfig: {
    footer: {
      message: '基于 MIT 许可发布',
      copyright: '版权所有 © ActView',
    },
  },
}
```

## 最后更新 {#last-updated}

```ts
export default {
  lastUpdated: true,
  themeConfig: {
    lastUpdated: {
      text: '最后更新于',
    },
  },
}
```
