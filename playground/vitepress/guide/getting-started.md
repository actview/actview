# 快速开始 {#getting-started}

## 前置条件 {#prerequisites}

- Node.js
- pnpm
- 一个 ActView 项目或文档目录

## 启动开发服务器 {#dev}

在仓库根目录运行：

```bash
pnpm dev:vitepress
```

打开终端输出的地址，通常是：

```text
http://localhost:5173/
```

## 目录结构 {#structure}

```text
playground/vitepress/
├─ .vitepress/
│  └─ config.ts
├─ guide/
│  └─ getting-started.md
├─ reference/
│  └─ cli.md
├─ index.md
└─ public/
```

## 编写第一页 {#first-page}

在 `index.md` 或 `guide/` 下创建 Markdown：

```md
# Hello

这是第一段文档。
```

保存后页面会热更新。

## 构建和预览 {#build-and-preview}

```bash
pnpm build:vitepress
pnpm preview:vitepress
```

构建输出：

```text
playground/vitepress/.vitepress/dist/
```

下一步：了解 [路由](/guide/routing) 和 [Markdown 扩展](/guide/markdown)。
