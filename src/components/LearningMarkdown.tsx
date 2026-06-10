import { useEffect, useMemo, useState } from 'react'
import mermaid from 'mermaid'
import { Check, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { ArtifactSegment, MarkdownCodeProps } from '../types'

let mermaidCounter = 0

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
  const rawCode = String(children ?? '').replace(/\n$/, '')
  const language = /language-([\w-]+)/.exec(className)?.[1] ?? 'python'

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
      <pre>
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

export function LearningMarkdown({ content, renderMermaid = true }: { content: string; renderMermaid?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: ({ children }) => <>{children}</>,
        code: (props) => <MarkdownCodeBlock {...props} renderMermaid={renderMermaid} />,
      }}
    >
      {prepareAssistantMarkdown(content)}
    </ReactMarkdown>
  )
}
