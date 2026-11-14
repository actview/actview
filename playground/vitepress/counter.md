<script>
import Counter from './components/Counter'
</script>
# Counter 示例

## 源码

下面这个 `<script>` 不会作为页面内容显示，它会被构建器整体提升到生成模块顶部：

```tsx
<script>
import Counter from './components/Counter'
</script>

<Counter label="Clicked" />
```

## 渲染效果

下面是 `<Counter />` 实际渲染出来的组件：

<Counter label="Clicked" />

点击按钮会增加计数。
