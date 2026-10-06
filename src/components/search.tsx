import { Search as SearchIcon } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildIndex, search } from '@/lib/search'

const Ctx = createContext<() => void>(() => {})

/** Opens the palette from anywhere. */
export const useOpenSearch = () => useContext(Ctx)

/** The search palette (Cmd/Ctrl+K or "/"). One entry per heading section of the docs. */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = () => setOpen(true)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement | null)?.closest('input, textarea, [contenteditable]')
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault()
        setOpen(true)
      } else if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <Ctx.Provider value={toggle}>
      {children}
      {open ? <Palette onClose={() => setOpen(false)} /> : null}
    </Ctx.Provider>
  )
}

function Palette({ onClose }: { onClose: () => void }) {
  const index = useMemo(() => buildIndex(), [])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const results = useMemo(() => search(index, query), [index, query])
  useEffect(() => input.current?.focus(), [])
  useEffect(() => setSelected(0), [query])

  const go = (href: string) => {
    onClose()
    navigate(href)
  }
  return (
    <div className="palette-backdrop" onMouseDown={onClose} role="presentation">
      <div className="palette" role="dialog" aria-label="Search the documentation" onMouseDown={(event) => event.stopPropagation()}>
        <input
          ref={input}
          value={query}
          placeholder="Search the docs: definePlugin, scope, E_MISSING_DEPENDENCY..."
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setSelected((value) => Math.min(value + 1, results.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setSelected((value) => Math.max(value - 1, 0))
            } else if (event.key === 'Enter' && results[selected]) {
              go(results[selected].href)
            }
          }}
        />
        <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          {query && results.length === 0 ? <p className="label" style={{ padding: '1.2rem' }}>No matches</p> : null}
          {results.map((entry, position) => (
            <a
              key={`${entry.href}-${position}`}
              href={entry.href}
              className="palette-item"
              aria-selected={position === selected}
              onMouseEnter={() => setSelected(position)}
              onClick={(event) => {
                event.preventDefault()
                go(entry.href)
              }}
            >
              <div className="label">{entry.pageTitle}</div>
              <div style={{ fontWeight: 650 }}>{entry.heading}</div>
              <div style={{ color: 'var(--ink-mute)', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.text}</div>
            </a>
          ))}
          {!query ? (
            <p className="label" style={{ padding: '1.2rem' }}>
              Type to search every page <SearchIcon size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
