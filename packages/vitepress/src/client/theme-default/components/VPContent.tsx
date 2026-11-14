import { ActViewComponent, Component, Dynamic, Prop } from 'actview'
import { useData } from '../composables/data'
import { useLayout } from '../composables/layout'
import { useRoute } from '../composables/route'
import { VPDoc } from './VPDoc'
import { VPHome } from './VPHome'
import { VPPage } from './VPPage'
import '../extract-css/VPContent.scoped.css'
export interface VPContentProps {
  content?: any
  notFound?: any
  pageTop?: any
  pageBottom?: any
  [key: string]: any
}

@Component({ name: 'VPContent' })
export class VPContent extends ActViewComponent<VPContentProps> {
  @Prop
  content?: any
  @Prop
  notFound?: any
  @Prop
  pageTop?: any
  @Prop
  pageBottom?: any

  render() {
    const props = this.$props
    const { page, frontmatter } = useData()
    const { isHome, hasSidebar } = useLayout()
    const currentRoute = useRoute()
    const component = currentRoute.value.component ?? props.content
    return (
      <div
        class={[
          'VPContent',
          hasSidebar.value ? 'has-sidebar' : '',
          isHome.value ? 'is-home' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        id="VPContent"
      >
        {page.value.isNotFound ? (
          props.notFound ? (
            <Dynamic is={props.notFound} />
          ) : (
            <div class="NotFound">Page not found.</div>
          )
        ) : frontmatter.value.layout === 'page' ? (
          <VPPage content={component} pageTop={props.pageTop} pageBottom={props.pageBottom} />
        ) : frontmatter.value.layout === 'home' ? (
          <VPHome content={component} />
        ) : (
          <VPDoc content={component} {...props} />
        )}
      </div>
    )
  }
}