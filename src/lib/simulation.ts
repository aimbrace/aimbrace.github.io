/** A plugin graph as the framework exports it (`aimbrace graph --format json`). */
export interface GraphData {
  ok: boolean
  nodes: Array<{ id: string; version?: string; requires: string[]; optional: string[]; provides: string[]; index: number }>
  edges: Array<{ from: string; to: string; service: string; optional: boolean }>
  order: string[]
}

export type Phase = 'stopped' | 'starting' | 'running' | 'stopping'
export type Status = 'idle' | 'running' | 'pending' | 'removed' | 'stopped'

/** What the lifecycle simulation is doing right now. `cursor` counts how many plugins the current phase has handled. */
export interface Simulation {
  phase: Phase
  cursor: number
  removed: readonly string[]
}

export const initial: Simulation = { phase: 'stopped', cursor: 0, removed: [] }

/** Plugins a plugin depends on, directly (required edges only: they decide whether it can run). */
export function dependenciesOf(graph: GraphData, id: string): string[] {
  return graph.edges.filter((edge) => edge.to === id && !edge.optional).map((edge) => edge.from)
}

/** True when `id` cannot run because a plugin it needs, directly or not, was removed. */
export function blockedBy(graph: GraphData, id: string, removed: readonly string[], seen = new Set<string>()): boolean {
  if (seen.has(id)) return false
  seen.add(id)
  return dependenciesOf(graph, id).some((dependency) => removed.includes(dependency) || blockedBy(graph, dependency, removed, seen))
}

/** The status of one plugin in a simulation. Mirrors the runtime: installed in order, stopped in reverse, pending without a provider. */
export function statusOf(graph: GraphData, sim: Simulation, id: string): Status {
  const position = graph.order.indexOf(id)
  const total = graph.order.length
  if (sim.phase === 'stopped') return 'idle'
  if (sim.phase === 'starting') return position < sim.cursor ? 'running' : 'idle'
  const live = sim.removed.includes(id) ? 'removed' : blockedBy(graph, id, sim.removed) ? 'pending' : 'running'
  if (sim.phase === 'stopping') return position >= total - sim.cursor ? 'stopped' : live
  return live
}

/** The hook the runtime fires as the simulation takes its next step, for the event log. */
export function eventFor(graph: GraphData, sim: Simulation): string | undefined {
  if (sim.phase === 'starting' && sim.cursor > 0) return `plugin:started ${graph.order[sim.cursor - 1]}`
  if (sim.phase === 'stopping' && sim.cursor > 0) return `plugin:stopped ${graph.order[graph.order.length - sim.cursor]}`
  return undefined
}

export type Action = { type: 'start' } | { type: 'tick' } | { type: 'stop' } | { type: 'remove'; id: string } | { type: 'restore'; id: string } | { type: 'reset' }

/** Advance a simulation. Pure, so it is tested without a browser. */
export function step(graph: GraphData, sim: Simulation, action: Action): Simulation {
  const total = graph.order.length
  switch (action.type) {
    case 'start':
      return sim.phase === 'stopped' ? { phase: 'starting', cursor: 0, removed: [] } : sim
    case 'stop':
      return sim.phase === 'running' ? { ...sim, phase: 'stopping', cursor: 0 } : sim
    case 'tick':
      if (sim.phase === 'starting') return sim.cursor + 1 >= total ? { ...sim, phase: 'running', cursor: total } : { ...sim, cursor: sim.cursor + 1 }
      if (sim.phase === 'stopping') return sim.cursor + 1 > total ? initial : { ...sim, cursor: sim.cursor + 1 }
      return sim
    case 'remove':
      return sim.phase === 'running' && !sim.removed.includes(action.id) ? { ...sim, removed: [...sim.removed, action.id] } : sim
    case 'restore':
      return { ...sim, removed: sim.removed.filter((id) => id !== action.id) }
    case 'reset':
      return initial
  }
}

/** Longest path from a root, for layering the diagram. */
export function depths(graph: GraphData): Record<string, number> {
  const memo: Record<string, number> = {}
  const depth = (id: string, seen: string[] = []): number => {
    if (memo[id] !== undefined) return memo[id] as number
    if (seen.includes(id)) return 0
    const parents = dependenciesOf(graph, id)
    const value = parents.length === 0 ? 0 : 1 + Math.max(...parents.map((parent) => depth(parent, [...seen, id])))
    memo[id] = value
    return value
  }
  for (const node of graph.nodes) depth(node.id)
  return memo
}
