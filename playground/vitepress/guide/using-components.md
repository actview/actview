<script>
import Counter from '../components/Counter'
</script>

<script component>
import { ActViewComponent, Component, Ref } from 'actview'

@Component({ name: 'InlineCounter' })
class InlineCounter extends ActViewComponent {
  @Ref count = 0

  render() {
    return (
      <button onClick={() => this.count++}>
        Inline: {this.count}
      </button>
    )
  }
}
</script>

# 使用组件 {#using-components}

ActView Press 支持在 Markdown 中直接使用 ActView 类组件。

## 导入组件 {#import-component}

`<script>` 内容会整体提升到生成模块顶部：

```tsx
<script>
import Counter from '../components/Counter'
</script>

# Counter 示例

<Counter label="Clicked" />
```

## 渲染效果 {#rendered}

下面是 `Counter` 实际渲染效果：

<Counter label="Clicked" />

点击按钮会增加计数。

## 在 Markdown 中定义组件 {#define-inline}

也可以把类组件直接写在 `<script component>` 中：

```tsx
<script component>
import { ActViewComponent, Component, Ref } from 'actview'

@Component({ name: 'InlineCounter' })
class InlineCounter extends ActViewComponent {
  @Ref count = 0

  render() {
    return (
      <button onClick={() => this.count++}>
        Inline: {this.count}
      </button>
    )
  }
}
</script>

<InlineCounter />
```

实际效果：

<InlineCounter />

## 支持范围 {#support}

支持：

- 默认导入、命名导入和别名
- 静态属性，例如 `label="Clicked"`
- 组件 children
- 组件类内部的 `@Prop` / `@Ref`

暂不支持：

- `v-if` / `v-for`
- `{{ }}`
- `:prop` / `@event`
- Vue `<script setup>` 的响应式语义
