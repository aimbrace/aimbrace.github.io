import { Play, RotateCcw, Square } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import agent from '@/content/agent-graph.json'
import { depths, eventFor, type GraphData, initial, type Simulation, statusOf, step, type Status } from '@/lib/simulation'

const graph = agent.graph as GraphData

/** Registry contributions are not a concept of the plugin library, so there are none to draw. */
const CONTRIBUTIONS: Record<string, { to: string; registry: string }> = {}

const W = 176
const H = 46
const GAP_X = 74
const GAP_Y = 22

interface Placed {
  id: string
  x: number
  y: number
  column: number
}

function layout(): { nodes: Placed[]; width: number; height: number } {
  const layers = depths(graph)
  const contributors = new Set(Object.keys(CONTRIBUTIONS))
  const connected = new Set(graph.edges.flatMap((edge) => [edge.from, edge.to]))
  const maxDepth = Math.max(0, ...Object.values(layers))
  const columnOf = (id: string) => (contributors.has(id) ? 0 : connected.has(id) ? 1 + (layers[id] ?? 0) : 2 + maxDepth)
  const rows: Record<number, number> = {}
  const nodes = graph.order.map((id) => {
    const column = columnOf(id)
    const row = rows[column] ?? 0
    rows[column] = row + 1
    return { id, column, x: column * (W + GAP_X), y: row * (H + GAP_Y) }
  })
  const columns = Math.max(...nodes.map((node) => node.column)) + 1
  const tallest = Math.max(...Object.values(rows))
  return { nodes, width: columns * W + (columns - 1) * GAP_X, height: tallest * H + (tallest - 1) * GAP_Y }
}

const COLORS: Record<Status, { stroke: string; fill: string; text: string }> = {
  idle: { stroke: 'var(--line-strong)', fill: 'var(--bg-sunken)', text: 'var(--ink-mute)' },
  running: { stroke: 'var(--ok)', fill: 'color-mix(in srgb, var(--ok) 10%, var(--bg-elevated))', text: 'var(--ink)' },
  pending: { stroke: 'var(--warn)', fill: 'color-mix(in srgb, var(--warn) 12%, var(--bg-elevated))', text: 'var(--ink)' },
  removed: { stroke: 'var(--bad)', fill: 'color-mix(in srgb, var(--bad) 10%, var(--bg-elevated))', text: 'var(--ink-mute)' },
  stopped: { stroke: 'var(--ink-mute)', fill: 'var(--bg-sunken)', text: 'var(--ink-mute)' },
}

export function GraphExplorer({ compact = false }: { compact?: boolean }) {
  const { nodes, width, height } = useMemo(layout, [])
  const [sim, setSim] = useState<Simulation>(initial)
  const [selected, setSelected] = useState<string>('agent')
  const [log, setLog] = useState<string[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const simRef = useRef(sim)
  simRef.current = sim

  const push = useCallback((...lines: string[]) => setLog((previous) => [...previous, ...lines].slice(-40)), [])
  const dispatch = useCallback((action: Parameters<typeof step>[2]) => {
    const next = step(graph, simRef.current, action)
    simRef.current = next
    setSim(next)
    return next
  }, [])

  // Drive start and stop with a tick, so the order is visible. Reduced-motion users get the same steps, just not slower.
  useEffect(() => {
    if (sim.phase !== 'starting' && sim.phase !== 'stopping') return
    timer.current = setInterval(() => {
      const before = simRef.current
      const next = dispatch({ type: 'tick' })
      const line = eventFor(graph, next)
      if (line) push(line)
      if (before.phase === 'starting' && next.phase === 'running') push('app:ready')
      if (before.phase === 'stopping' && next.phase === 'stopped') push('app:stopped')
    }, 420)
    return () => clearInterval(timer.current)
  }, [sim.phase, dispatch, push])

  const start = () => {
    if (sim.phase !== 'stopped') return
    setLog(['graph:built', 'app:starting'])
    dispatch({ type: 'start' })
  }
  const stop = () => {
    if (sim.phase !== 'running') return
    push('app:stopping')
    dispatch({ type: 'stop' })
  }
  const reset = () => {
    clearInterval(timer.current)
    setLog([])
    dispatch({ type: 'reset' })
  }
  const remove = (id: string) => {
    dispatch({ type: 'remove', id })
    const stopped = graph.nodes.filter((node) => node.id !== id && statusOf(graph, { ...simRef.current }, node.id) === 'pending').map((node) => node.id)
    push(`plugin:dispose ${id}`, ...stopped.map((dependent) => `plugin:stop ${dependent}   (now pending)`))
  }
  const restore = (id: string) => {
    const before = graph.nodes.filter((node) => statusOf(graph, simRef.current, node.id) === 'pending').map((node) => node.id)
    const next = dispatch({ type: 'restore', id })
    const back = before.filter((node) => statusOf(graph, next, node) === 'running')
    push(`plugin:install ${id}`, ...back.map((dependent) => `plugin:install ${dependent}   (reactivated)`))
  }

  const node = graph.nodes.find((candidate) => candidate.id === selected)
  const status = statusOf(graph, sim, selected)
  const byId = Object.fromEntries(nodes.map((placed) => [placed.id, placed]))
  const busy = sim.phase === 'starting' || sim.phase === 'stopping'

  const edges = graph.edges.map((edge) => ({ ...edge, key: `${edge.from}-${edge.to}-${edge.service}` }))
  const contributions = Object.entries(CONTRIBUTIONS).map(([from, value]) => ({ from, ...value }))
  const path = (from: Placed, to: Placed) => {
    const x1 = from.x + W
    const y1 = from.y + H / 2
    const x2 = to.x
    const y2 = to.y + H / 2
    const mid = (x1 + x2) / 2
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`
  }

  return (
    <div className="card" style={{ padding: compact ? '1.2rem' : '1.6rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', marginBottom: '1.1rem' }}>
        <button type="button" className="btn btn-sm btn-primary" onClick={start} disabled={sim.phase !== 'stopped'}>
          <Play size={13} /> Start
        </button>
        <button type="button" className="btn btn-sm" onClick={stop} disabled={sim.phase !== 'running'}>
          <Square size={12} /> Stop
        </button>
        <button type="button" className="btn btn-sm" onClick={reset} disabled={sim.phase === 'stopped' && log.length === 0}>
          <RotateCcw size={13} /> Reset
        </button>
        <span className="pill" aria-live="polite">
          app: {sim.phase}
        </span>
        <span className="label" style={{ marginLeft: 'auto' }}>the agent template's plugins</span>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '0.3rem' }}>
        <svg className="explorer-svg" viewBox={`-8 -8 ${width + 16} ${height + 16}`} style={{ minWidth: Math.min(width, 640), width: '100%', maxHeight: compact ? 270 : 330 }} role="group" aria-label="Plugin dependency graph">
          {edges.map((edge) => {
            const from = byId[edge.from]
            const to = byId[edge.to]
            if (!from || !to) return null
            const blocked = statusOf(graph, sim, edge.from) !== 'running' && sim.phase === 'running'
            return <path key={edge.key} className="edge" d={path(from, to)} style={{ stroke: selected === edge.from || selected === edge.to ? 'var(--accent)' : blocked ? 'var(--warn)' : undefined, opacity: sim.phase === 'stopped' ? 0.6 : 1 }} />
          })}
          {contributions.map((link) => {
            const from = byId[link.from]
            const to = byId[link.to]
            if (!from || !to) return null
            return <path key={link.from} className="edge edge-contrib" d={path(from, to)} />
          })}
          {nodes.map((placed) => {
            const state = statusOf(graph, sim, placed.id)
            const color = COLORS[state]
            const meta = graph.nodes.find((candidate) => candidate.id === placed.id)
            const subtitle = CONTRIBUTIONS[placed.id] ? `adds to ${CONTRIBUTIONS[placed.id]?.registry}` : meta?.provides.length ? `provides ${meta.provides.join(', ')}` : meta?.requires.length ? `needs ${meta.requires.join(', ')}` : 'no service'
            return (
              <g
                key={placed.id}
                className="node"
                transform={`translate(${placed.x} ${placed.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${placed.id}, ${state}`}
                aria-pressed={selected === placed.id}
                onClick={() => setSelected(placed.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelected(placed.id)
                  }
                }}
              >
                <rect width={W} height={H} rx={9} fill={color.fill} stroke={selected === placed.id ? 'var(--accent)' : color.stroke} strokeWidth={selected === placed.id ? 2.2 : 1.4} strokeDasharray={state === 'removed' ? '5 4' : undefined} />
                <text x={12} y={19} fontSize={12.5} fontWeight={500} fill={color.text}>{placed.id}</text>
                <text x={12} y={34} fontSize={9.5} fill="var(--ink-mute)">{subtitle.length > 26 ? `${subtitle.slice(0, 25)}...` : subtitle}</text>
                <circle cx={W - 14} cy={14} r={4} fill={color.stroke} />
              </g>
            )
          })}
        </svg>
      </div>
      <p className="label" style={{ margin: '0.4rem 0 1rem', textTransform: 'none', letterSpacing: 0 }}>
        Lines are injected services: the arrow runs from the plugin that provides a service to the plugin that needs it. Plugins start in this order and are stopped and disposed in reverse.
      </p>

      <div style={{ display: 'grid', gap: '1.2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
        <div>
          <div className="label" style={{ marginBottom: '0.4rem' }}>selected plugin</div>
          {node ? (
            <div style={{ fontSize: '0.88rem' }}>
              <div style={{ fontWeight: 750, fontSize: '1rem' }}>
                {node.id} <span className="pill">{status}</span>
              </div>
              <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', marginTop: '0.4rem', lineHeight: 1.7 }}>
                requires: {node.requires.length ? node.requires.join(', ') : '(nothing)'}
                <br />
                provides: {node.provides.length ? node.provides.join(', ') : '(nothing)'}
                {CONTRIBUTIONS[node.id] ? (
                  <>
                    <br />
                    contributes to registry {CONTRIBUTIONS[node.id]?.registry}
                  </>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-sm" disabled={sim.phase !== 'running' || sim.removed.includes(selected) || busy || node.provides.length === 0} onClick={() => remove(selected)}>
                  Remove provider
                </button>
                <button type="button" className="btn btn-sm" disabled={!sim.removed.includes(selected)} onClick={() => restore(selected)}>
                  Install it again
                </button>
              </div>
              {sim.phase === 'running' && node.provides.length > 0 ? <p style={{ color: 'var(--ink-mute)', fontSize: '0.78rem', margin: '0.6rem 0 0' }}>Removing a provider stops its dependents; installing a provider again reactivates them.</p> : null}
            </div>
          ) : null}
        </div>
        <div>
          <div className="label" style={{ marginBottom: '0.4rem' }}>events</div>
          <div style={{ minHeight: '7.5rem', maxHeight: '11rem', overflowY: 'auto', borderLeft: '2px solid var(--line)', paddingLeft: '0.8rem' }} aria-live="polite">
            {log.length === 0 ? <div className="log-line" style={{ color: 'var(--ink-mute)' }}>Press Start.</div> : null}
            {log.map((line, index) => (
              <div key={`${index}-${line}`} className="log-line pop">{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
