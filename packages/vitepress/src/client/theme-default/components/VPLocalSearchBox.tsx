import {
  ActViewComponent,
  Component,
  Mounted,
  Ref,
  Unmounted,
} from 'actview'
import MiniSearch from 'minisearch'
import localSearchIndex from 'virtual:actview-search-index'
import '../extract-css/VPLocalSearchBox.scoped.css'
import { useData } from '../composables/data'
import { useRouter } from '../composables/route'

interface SearchResult {
  id: string
  title: string
  titles?: string[]
  text?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlight(text: string, query: string): string {
  const source = escapeHtml(text)
  const terms = [...new Set(query.trim().split(/\s+/).filter(Boolean))]
  if (!terms.length) return source
  const pattern = new RegExp(
    `(${terms
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')})`,
    'gi',
  )
  return source.replace(pattern, '<mark>$1</mark>')
}

@Component({ name: 'VPLocalSearchBox' })
export class VPLocalSearchBox extends ActViewComponent {
  @Ref
  open = false

  @Ref
  query = ''

  @Ref
  results: SearchResult[] = []

  @Ref
  selectedIndex = 0

  @Ref
  loaded = false

  private index: MiniSearch<SearchResult> | null = null

  private onKeydown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    const editing =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.isContentEditable

    if (
      (event.key === 'k' || event.key === 'K') &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault()
      this.openSearch()
      return
    }
    if (event.key === '/' && !editing) {
      event.preventDefault()
      this.openSearch()
      return
    }
    if (!this.open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      this.close()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.selectedIndex = Math.min(
        this.selectedIndex + 1,
        this.results.length - 1,
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0)
    } else if (event.key === 'Enter') {
      const result = this.results[this.selectedIndex]
      if (!result) return
      event.preventDefault()
      useRouter().go(result.id)
      this.close()
    }
  }

  private onOpenEvent = () => {
    this.openSearch()
  }

  @Mounted
  mounted(): void {
    window.addEventListener('keydown', this.onKeydown)
    window.addEventListener('actview:search-open', this.onOpenEvent)
  }

  @Unmounted
  unmounted(): void {
    window.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('actview:search-open', this.onOpenEvent)
  }

  private async ensureIndex(): Promise<void> {
    if (this.index || this.loaded) return
    const { localeIndex } = useData()
    const key = localeIndex.value || 'root'
    const loader = localSearchIndex[key] ?? localSearchIndex.root
    if (!loader) {
      this.loaded = true
      return
    }
    try {
      const module = await loader()
      this.index = MiniSearch.loadJSON<SearchResult>(module.default, {
        fields: ['title', 'titles', 'text'],
        storeFields: ['title', 'titles', 'text'],
        searchOptions: {
          fuzzy: 0.2,
          prefix: true,
          boost: { title: 4, text: 2, titles: 1 },
        },
      })
    } catch (error) {
      console.error('[actview] local search index load failed', error)
    } finally {
      this.loaded = true
    }
  }

  private async openSearch(): Promise<void> {
    this.open = true
    await this.ensureIndex()
    this.search()
    requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>('.VPLocalSearchBox .search-input')?.focus()
    })
  }

  private close(): void {
    this.open = false
    this.query = ''
    this.results = []
    this.selectedIndex = 0
  }

  private search(): void {
    if (!this.index || !this.query.trim()) {
      this.results = []
      return
    }
    this.results = this.index.search(this.query).slice(0, 16) as unknown as SearchResult[]
    this.selectedIndex = 0
  }

  private onInput(event: Event): void {
    this.query = (event.target as HTMLInputElement).value
    this.search()
  }

  render() {
    if (!this.open) return null
    const router = useRouter()
    return (
      <div class="VPLocalSearchBox">
        <div class="backdrop" onClick={() => this.close()} />
        <div class="shell" role="dialog" aria-label="Search">
          <div class="search-bar">
            <span class="vpi-search search-icon" aria-hidden="true" />
            <input
              class="search-input"
              value={this.query}
              placeholder="Search"
              aria-label="Search"
              onInput={(event) => this.onInput(event)}
            />
            <button class="cancel" type="button" onClick={() => this.close()}>
              Esc
            </button>
          </div>
          {this.query.trim() ? (
            <div class="results">
              {this.results.length ? (
                this.results.map((result, index) => (
                  <a
                    key={result.id}
                    class={[
                      'result',
                      index === this.selectedIndex ? 'selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    href={result.id}
                    onClick={(event) => {
                      event.preventDefault()
                      router.go(result.id)
                      this.close()
                    }}
                  >
                    <div>
                      {result.titles?.length ? (
                        <div class="titles">
                          {result.titles.map((title) => (
                            <span key={title} class="title">
                              {title}
                            </span>
                          ))}
                          <span class="title-icon">›</span>
                        </div>
                      ) : null}
                      <div class="title main">{result.title}</div>
                      {result.text ? (
                        <div class="excerpt">
                          <span
                            {...({
                              innerHTML: highlight(result.text, this.query),
                            } as any)}
                          />
                        </div>
                      ) : null}
                    </div>
                  </a>
                ))
              ) : (
                <div class="no-results">
                  {this.loaded ? 'No results' : 'Loading…'}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    )
  }
}
