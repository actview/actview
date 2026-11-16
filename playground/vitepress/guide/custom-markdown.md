# 自定义 markdown-it {#custom-markdown-it}

可以在 `.vitepress/config.ts` 中注册 markdown-it 插件：

```ts
export default {
  markdown: {
    config(md) {
      md.inline.ruler.before('emphasis', 'highlight', handler)
    },
  },
}
```

当前示例注册了 `==highlight==`：

==高亮文本==

以及仍然正常的 **粗体** 和 *斜体*。

更多配置见 [站点配置](/reference/config)。
