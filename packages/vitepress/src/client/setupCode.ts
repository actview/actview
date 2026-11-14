export function setupCodeHandlers(): void {
  if (typeof window === 'undefined') return
  const marker = '__actviewCodeHandlers'
  if ((window as any)[marker]) return
  ;(window as any)[marker] = true

  document.addEventListener('click', async (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const button = target.closest<HTMLButtonElement>('button.copy')
    if (!button) return
    const wrapper = button.closest<HTMLElement>('[class*="language-"]')
    const code = wrapper?.querySelector('code')?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    button.classList.add('copied')
    const original = button.title
    button.title = 'Copied'
    window.setTimeout(() => {
      button.classList.remove('copied')
      button.title = original
    }, 1200)
  })

  document.addEventListener('change', (event) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return
    const group = target.closest('.vp-code-group')
    if (!group) return
    const inputs = Array.from(group.querySelectorAll('.tabs input'))
    const index = inputs.indexOf(target)
    const blocks = group.querySelector('.blocks')
    if (!blocks || index < 0) return
    Array.from(blocks.children).forEach((block, i) => {
      block.classList.toggle('active', i === index)
    })
  })
}
