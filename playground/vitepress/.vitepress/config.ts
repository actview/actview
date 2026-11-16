export default {
  title: 'vitepress-actview',
  description: '由 Vite 驱动的 ActView 文档站点生成器',
  lastUpdated: true,
  rewrites: {
    '/guide/routing': '/guide/old-routing',
  },
  dynamicRoutes: [
    {
      path: '/guide/dynamic/42',
      file: 'guide/dynamic.md',
    },
  ],
  transformPageData(data: any) {
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
  markdown: {
    config(md: any) {
      md.inline.ruler.before(
        'emphasis',
        'actview-highlight',
        (state: any, silent: boolean) => {
          const start = state.pos
          if (state.src.slice(start, start + 2) !== '==') return false
          const end = state.src.indexOf('==', start + 2)
          if (end < 0) return false
          if (!silent) {
            state.push('mark_open', 'mark', 1)
            const text = state.push('text', '', 0)
            text.content = state.src.slice(start + 2, end)
            state.push('mark_close', 'mark', -1)
          }
          state.pos = end + 2
          return true
        },
      )
    },
  },
  themeConfig: {
    nav: [
      {
        text: '指南',
        link: '/guide/what-is-vitepress-actview',
        activeMatch: '/guide/',
      },
      {
        text: '参考',
        link: '/reference/cli',
        activeMatch: '/reference/',
      },
    ],
    sidebar: [
      {
        text: '简介',
        items: [
          {
            text: '什么是 vitepress-actview？',
            link: '/guide/what-is-vitepress-actview',
          },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '路由', link: '/guide/routing' },
        ],
      },
      {
        text: '写作',
        items: [
          { text: 'Markdown 扩展', link: '/guide/markdown' },
          { text: '使用组件', link: '/guide/using-components' },
          { text: 'Math', link: '/guide/math' },
          { text: 'CJK 友好', link: '/guide/cjk' },
        ],
      },
      {
        text: '进阶',
        items: [
          {
            text: '自定义 markdown-it',
            link: '/guide/custom-markdown',
          },
          {
            text: 'transformPageData',
            link: '/guide/transform-page-data',
          },
          { text: '最后更新时间', link: '/guide/last-updated' },
          { text: '动态路由', link: '/guide/dynamic/42' },
          {
            text: 'Rewrites 示例',
            link: '/guide/old-routing',
          },
        ],
      },
      {
        text: '参考',
        items: [
          { text: 'CLI', link: '/reference/cli' },
          { text: '站点配置', link: '/reference/config' },
          { text: '页面数据', link: '/reference/page-data' },
          { text: '默认主题', link: '/reference/default-theme' },
        ],
      },
    ],
    outline: [2, 3],
    outlineTitle: '页面导航',
    aside: true,
    footer: {
      message: '基于 MIT 许可发布',
      copyright: '版权所有 © ActView',
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    lastUpdated: {
      text: '最后更新于',
    },
  },
}
