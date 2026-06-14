import { isValidElement, useEffect, useMemo, useState, type ReactNode } from 'react'
import mermaid from 'mermaid'
import { Check, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import python from '@shikijs/langs/python'
import javascript from '@shikijs/langs/javascript'
import typescript from '@shikijs/langs/typescript'
import jsx from '@shikijs/langs/jsx'
import tsx from '@shikijs/langs/tsx'
import json from '@shikijs/langs/json'
import shellscript from '@shikijs/langs/shellscript'
import markdown from '@shikijs/langs/markdown'
import githubLight from '@shikijs/themes/github-light'
import nightOwl from '@shikijs/themes/night-owl'
import type { ArtifactSegment, MarkdownCodeProps } from '../types'

let mermaidCounter = 0
let highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null

const SHIKI_LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'json',
  'bash',
  'shellscript',
  'markdown',
] as const

type SupportedShikiLanguage = (typeof SHIKI_LANGUAGES)[number]

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubLight, nightOwl],
      langs: [python, javascript, typescript, jsx, tsx, json, shellscript, markdown],
      engine: createJavaScriptRegexEngine(),
    })
  }
  return highlighterPromise
}

function normalizeCodeLanguage(language: string): SupportedShikiLanguage {
  const lower = language.toLowerCase()
  if (lower === 'py') return 'python'
  if (lower === 'js') return 'javascript'
  if (lower === 'ts') return 'typescript'
  if (lower === 'sh' || lower === 'shell' || lower === 'powershell' || lower === 'ps1') return 'shellscript'
  if (SHIKI_LANGUAGES.includes(lower as SupportedShikiLanguage)) return lower as SupportedShikiLanguage
  return 'python'
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables: {
    primaryColor: '#eef6ff',
    primaryTextColor: '#162033',
    primaryBorderColor: '#8bb8e8',
    lineColor: '#0b6bcb',
    secondaryColor: '#f8fafc',
    tertiaryColor: '#fff9db',
    fontFamily: 'Inter, "Microsoft YaHei", sans-serif',
  },
})

function getNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return ''
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('')
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children)
  }

  return ''
}

export function prepareAssistantMarkdown(content: string) {
  const lines = content.split('\n')
  let inFence = false

  return lines
    .map((line) => {
      if (!line.startsWith('```')) {
        return line
      }

      const fenceInfo = line.slice(3).trim()
      if (!inFence) {
        inFence = true
        return fenceInfo ? line : '```python'
      }

      inFence = false
      return '```'
    })
    .join('\n')
}

export function parseArtifactSegments(content: string): ArtifactSegment[] {
  const segments: ArtifactSegment[] = []
  const regex = /```([\w-]*)\n([\s\S]*?)```/g
  let lastIndex = 0

  for (const match of content.matchAll(regex)) {
    const matchIndex = match.index ?? 0
    const before = content.slice(lastIndex, matchIndex).trim()
    if (before) {
      segments.push({ kind: 'markdown', content: before })
    }

    const language = match[1]?.trim() || undefined
    const code = match[2]?.replace(/\n+$/, '') ?? ''
    if (code.trim()) {
      segments.push({ kind: 'code', content: code, language })
    }

    lastIndex = matchIndex + match[0].length
  }

  const after = content.slice(lastIndex).trim()
  if (after) {
    segments.push({ kind: 'markdown', content: after })
  }

  return segments.length > 0 ? segments : [{ kind: 'markdown', content }]
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(false)
  const diagramId = useMemo(() => `learning-mermaid-${++mermaidCounter}`, [])

  useEffect(() => {
    let cancelled = false
    setSvg('')
    setError(false)

    void mermaid
      .render(diagramId, chart)
      .then((result) => {
        if (!cancelled) {
          setSvg(result.svg)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [chart, diagramId])

  if (error) {
    return (
      <div className="mermaid-diagram mermaid-error">
        <span>思维导图语法需要调整</span>
        <pre>{chart}</pre>
      </div>
    )
  }

  return <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg || '<span>正在生成图示...</span>' }} />
}

function MarkdownCodeBlock({
  inline,
  className = '',
  children,
  renderMermaid = true,
}: MarkdownCodeProps & { renderMermaid?: boolean }) {
  const [copied, setCopied] = useState(false)
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const rawCode = getNodeText(children).replace(/\n$/, '')
  const language = /language-([\w-]+)/.exec(className)?.[1] ?? 'python'
  const normalizedLanguage = normalizeCodeLanguage(language)

  useEffect(() => {
    let cancelled = false
    setHighlightedHtml('')

    if (inline || language.toLowerCase() === 'mermaid') {
      return () => {
        cancelled = true
      }
    }

    void getHighlighter()
      .then((highlighter) =>
        highlighter.codeToHtml(rawCode, {
          lang: normalizedLanguage,
          themes: {
            light: 'github-light',
            dark: 'night-owl',
          },
          defaultColor: false,
        }),
      )
      .then((html) => {
        if (!cancelled) {
          setHighlightedHtml(html)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHighlightedHtml('')
        }
      })

    return () => {
      cancelled = true
    }
  }, [inline, language, normalizedLanguage, rawCode])

  if (inline || (!className && !rawCode.includes('\n'))) {
    return <code className={className}>{children}</code>
  }

  if (language.toLowerCase() === 'mermaid') {
    if (!renderMermaid) {
      return (
        <div className="mermaid-diagram mermaid-pending">
          <span>图示生成完成后显示</span>
        </div>
      )
    }
    return <MermaidDiagram chart={rawCode} />
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="learning-code-block">
      <div className="learning-code-bar">
        <span>{language === 'python' || language === 'py' ? 'main.py' : language}</span>
        <button type="button" onClick={() => void handleCopy()} aria-label="复制代码">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      {highlightedHtml ? (
        <div className="shiki-code-render" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      ) : (
        <pre>
          <code>{rawCode}</code>
        </pre>
      )}
    </div>
  )
}

export function LearningMarkdown({ content, renderMermaid = true }: { content: string; renderMermaid?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children }) => <>{children}</>,
        code: (props) => <MarkdownCodeBlock {...props} renderMermaid={renderMermaid} />,
      }}
    >
      {prepareAssistantMarkdown(content)}
    </ReactMarkdown>
  )
}
