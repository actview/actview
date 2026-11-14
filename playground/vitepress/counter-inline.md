<script component>
import { ActViewComponent, Component, Ref } from 'actview'

@Component({ name: 'InlineCounter' })
class InlineCounter extends ActViewComponent {
  @Ref count = 0

  render() {
    return (
      <button class="demo-counter" onClick={() => this.count++}>
        Inline: {this.count}
      </button>
    )
  }
}
</script>
# Inline Counter

## 源码

下面这个 `<script component>` 不会作为页面内容显示，它会被构建器整体提升到生成模块顶部：

```tsx
<script component>
import { ActViewComponent, Component, Ref } from 'actview'

@Component({ name: 'InlineCounter' })
class InlineCounter extends ActViewComponent {
  @Ref count = 0

  render() {
    return (
      <button class="demo-counter" onClick={() => this.count++}>
        Inline: {this.count}
      </button>
    )
  }
}
</script>

<InlineCounter />
```

## 渲染效果

下面是 `<InlineCounter />` 实际渲染出来的组件：

<InlineCounter />

点击按钮会增加计数。
