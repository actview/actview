import { ActViewComponent, Component, Prop, Ref } from 'actview'

@Component({ name: 'Counter' })
export class Counter extends ActViewComponent<{ label?: string }> {
  @Prop
  label = 'Counter'

  @Ref
  count = 0

  render() {
    return (
      <button class="demo-counter" onClick={() => this.count++}>
        {this.label}: {this.count}
      </button>
    )
  }
}

export default Counter
