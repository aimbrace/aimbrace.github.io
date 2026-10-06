import { Check, Copy } from 'lucide-react'
import { Children, isValidElement, useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { resolveLink } from '@/lib/docs'

function textOf(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false)
  const code = Children.toArray(children)[0]
  const className = isValidElement(code) ? ((code.props as { className?: string }).className ?? '') : ''
  const language = /language-(\w+)/.exec(className)?.[1]
  return (
    <div className="code-block">
      {language ? <span className="label code-lang">{language}</span> : null}
      <button
        type="button"
        className="copy-btn"
        aria-label="Copy code"
        onClick={() => {
          void navigator.clipboard?.writeText(textOf(children)).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1400)
          })
        }}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? 'copied' : 'copy'}
      </button>
      <pre>{children}</pre>
    </div>
  )
}

/** Renders a docs page. `from` is the page's own path, so relative links resolve. */
export function Markdown({ children, from }: { children: string; from: string }) {
  return (
    <div className="prose-doc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={{
          a({ href = '', children: label }) {
            const link = resolveLink(href, from)
            if (link.kind === 'internal') return <Link to={link.href}>{label}</Link>
            if (link.kind === 'anchor') return <a href={link.href}>{label}</a>
            return (
              <a href={link.href} target="_blank" rel="noreferrer">
                {label}
              </a>
            )
          },
          pre: ({ children: inner }) => <CodeBlock>{inner}</CodeBlock>,
          table: ({ children: rows }) => (
            <div className="table-wrap">
              <table>{rows}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
