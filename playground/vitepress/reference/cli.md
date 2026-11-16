# CLI {#cli}

vitepress-actview 提供三个命令：

```bash
vitepress-actview dev <docs-root>
vitepress-actview build <docs-root>
vitepress-actview preview <docs-root>
```

仓库脚本：

```bash
pnpm dev:vitepress
pnpm build:vitepress
pnpm preview:vitepress
```

## dev {#dev}

启动 Vite 开发服务器，支持 Markdown HMR、组件 HMR 和 scoped CSS。

## build {#build}

构建静态站点：

```text
<docs-root>/.vitepress/dist/
├─ index.html
├─ guide/
│  └─ getting-started/
│     └─ index.html
├─ 404.html
└─ assets/
```

每个路由都会生成 HTML shell，页面由共享 client bundle 激活。

## preview {#preview}

启动构建产物预览：

```bash
pnpm preview:vitepress
```

默认地址：

```text
http://localhost:4173/
```
