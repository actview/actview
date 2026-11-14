# Inline Counter

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
