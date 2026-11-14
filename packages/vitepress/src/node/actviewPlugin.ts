// ============================================================
// Vite 插件：.md → ActView 页面模块
// ============================================================

import type { Plugin } from 'vite'
import { transformWithEsbuild } from 'vite'
import { markdownToActview } from './markdownToActview.ts'

export interface ActviewMarkdownOptions {
  /** 只处理匹配的 id；默认所有 .md */
  include?: RegExp
  /** 全局启用代码行号 */
  lineNumbers?: boolean
  codeCopyButtonTitle?: string
}

export function actviewMarkdown(
  options: ActviewMarkdownOptions = {},
): Plugin {
  return {
    name: 'actview:vitepress-markdown',
    enforce: 'pre',
    async transform(code, id) {
      const cleanId = id.split('?')[0]
      if (!cleanId.endsWith('.md')) return null
      if (options.include && !options.include.test(cleanId)) return null
      if (id.includes('?raw') || id.includes('?url')) return null

      const result = await markdownToActview(code, cleanId, {
        lineNumbers: options.lineNumbers,
        codeCopyButtonTitle: options.codeCopyButtonTitle,
      })

      // .md 模块不会经过 .tsx 的 decorator 转换；组件页面在插件内先编译 TSX。
      if (result.code.includes('@Component')) {
        const transformed = await transformWithEsbuild(
          result.code,
          `${cleanId}.tsx`,
          {
            loader: 'tsx',
            target: 'es2022',
            jsx: 'automatic',
            jsxImportSource: '@actview/jsx',
            tsconfigRaw: {
              compilerOptions: {
                experimentalDecorators: true,
                useDefineForClassFields: false,
              },
            },
          },
        )
        return {
          code: transformed.code,
          map: transformed.map,
        }
      }

      return {
        code: result.code,
        map: null,
      }
    },
  }
}
