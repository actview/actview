# 最后更新时间 {#last-updated}

## 配置 {#config}

```ts
export default {
  lastUpdated: true,
}
```

构建器会读取文件的 Git 提交时间，并写入：

```ts
pageData.lastUpdated
```

页脚会显示最后更新日期。

## 说明 {#notes}

- 新文件如果还没有提交，可能没有时间戳
- 可以在配置中设置 `lastUpdated: false` 关闭
- 页脚文案由 `themeConfig.lastUpdated.text` 控制

更多信息见 [页面数据](/reference/page-data)。
