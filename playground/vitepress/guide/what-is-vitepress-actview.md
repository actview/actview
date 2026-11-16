# vitepress-actview 是什么？ {#what-is-vitepress-actview}

vitepress-actview 是一个面向 ActView 的文档站点工具。它从 Markdown 生成页面，用默认主题提供导航、侧边栏、目录和代码块体验，并允许在 Markdown 中直接使用 ActView 组件。

## 使用场景 {#use-cases}

- **组件库文档**

  用 Markdown 编写 API、示例和指南，用 ActView 组件嵌入交互式演示。

- **项目文档**

  使用 `dev` 即时预览，使用 `build` 输出静态资源，使用 `preview` 在生产构建上检查站点。

- **ActView 生态说明**

  保持文档与 ActView 运行时、默认主题和组件 API 一致。

## 核心能力 {#features}

### Markdown 扩展 {#markdown-extensions}

支持容器、GitHub Alerts、代码高亮、行高亮、行号、代码组、TOC、属性、Emoji、代码片段和 include。详见 [Markdown 扩展](/guide/markdown)。

### ActView 组件 {#actview-components}

在 Markdown 的 `<script>` 中导入组件，然后直接在正文中使用：

```md
<script>
import Counter from '../components/Counter'
</script>

<Counter label="Clicked" />
```

详见 [使用组件](/guide/using-components)。

### 静态构建 {#static-build}

```bash
pnpm build:vitepress
pnpm preview:vitepress
```

构建结果位于 `.vitepress/dist`。

## 与 VitePress 的关系 {#relationship-with-vitepress}

vitepress-actview 借鉴了 VitePress 的文档结构和默认主题视觉，但页面由 ActView 类组件渲染，Markdown 管线也会生成 ActView 模块。

它不是 VitePress 的运行时替代品；已有的 VitePress 文档可以按 [Markdown 扩展](/guide/markdown) 和 [使用组件](/guide/using-components) 的方式逐步迁移。
