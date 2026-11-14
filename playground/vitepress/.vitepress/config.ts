export default {
  title: 'ActView Docs',
  description: 'ActView documentation site',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/' },
      { text: 'Guide page', link: '/guide' },
      { text: 'Markdown', link: '/markdown' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Markdown MVP', link: '/' },
          { text: 'Guide page', link: '/guide' },
          { text: 'Markdown 功能', link: '/markdown' },
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
