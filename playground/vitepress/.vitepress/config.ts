export default {
  title: 'ActView Docs',
  description: 'ActView documentation site',
  lastUpdated: true,
  rewrites: {
    '/guide': '/old-guide',
  },
  dynamicRoutes: [
    {
      path: '/dynamic/42',
      file: 'dynamic.md',
    },
  ],
  transformPageData(data: any) {
    if (data.relativePath === 'p2-transform.md') {
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
      { text: 'Guide', link: '/' },
      { text: 'Guide page', link: '/guide' },
      { text: 'Markdown', link: '/markdown' },
      { text: 'Counter', link: '/counter' },
      { text: 'P2', link: '/p2-math' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Markdown MVP', link: '/' },
          { text: 'Guide page', link: '/guide' },
          { text: 'Markdown 功能', link: '/markdown' },
          { text: 'Counter', link: '/counter' },
          { text: 'Inline Counter', link: '/counter-inline' },
        ],
      },
      {
        text: 'P2',
        items: [
          { text: 'Math', link: '/p2-math' },
          { text: 'CJK', link: '/p2-cjk' },
          { text: 'Transform Page Data', link: '/p2-transform' },
          { text: 'Custom markdown-it', link: '/p2-custom' },
          { text: 'P2 配置', link: '/p2-config' },
          { text: 'Dynamic Route', link: '/dynamic/42' },
          { text: 'Rewritten Guide', link: '/old-guide' },
        ],
      },
    ],
    outline: [2, 3],
    aside: true,
    footer: {
      message: 'Built with ActView',
      copyright: 'ActView documentation',
    },
    docFooter: { prev: 'Previous page', next: 'Next page' },
  },
}
