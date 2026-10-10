import { describe, expect, it } from 'vitest'
import agent from '../content/agent-graph.json'
import { depths, type GraphData, initial, statusOf, step } from './simulation'

const graph = agent.graph as GraphData
const statuses = (sim: ReturnType<typeof step>) => Object.fromEntries(graph.order.map((id) => [id, statusOf(graph, sim, id)]))

describe('lifecycle simulation over the real agent template graph', () => {
  it('uses the graph read from the framework', () => {
    expect(graph.ok).toBe(true)
    expect(graph.order).toHaveLength(13)
    expect(graph.order.indexOf('instance')).toBe(0)
    expect(graph.order.indexOf('openai')).toBeLessThan(graph.order.indexOf('agent'))
    expect(graph.order.indexOf('extensions')).toBeLessThan(graph.order.indexOf('builder'))
  })

  it('installs in dependency order and ends running', () => {
    let sim = step(graph, initial, { type: 'start' })
    expect(Object.values(statuses(sim)).every((s) => s === 'idle')).toBe(true)
    for (let i = 1; i <= graph.order.length; i++) {
      sim = step(graph, sim, { type: 'tick' })
      const running = graph.order.filter((id) => statusOf(graph, sim, id) === 'running')
      expect(running).toEqual(graph.order.slice(0, Math.min(i, graph.order.length)))
    }
    expect(sim.phase).toBe('running')
  })

  it('stops in the reverse order and returns to idle', () => {
    let sim = { phase: 'running', cursor: graph.order.length, removed: [] } as ReturnType<typeof step>
    sim = step(graph, sim, { type: 'stop' })
    const stoppedOrder: string[] = []
    for (let i = 0; i < graph.order.length; i++) {
      sim = step(graph, sim, { type: 'tick' })
      for (const id of graph.order) if (statusOf(graph, sim, id) === 'stopped' && !stoppedOrder.includes(id)) stoppedOrder.push(id)
    }
    expect(stoppedOrder).toEqual([...graph.order].reverse())
    expect(step(graph, sim, { type: 'tick' }).phase).toBe('stopped')
  })

  it('sends dependents of a removed provider to pending, and brings them back', () => {
    const running = { phase: 'running', cursor: graph.order.length, removed: [] } as ReturnType<typeof step>
    const removed = step(graph, running, { type: 'remove', id: 'extensions' })
    const after = statuses(removed)
    expect(after.extensions).toBe('removed')
    expect(after.builder).toBe('pending')
    expect(after.server).toBe('running')
    const restored = step(graph, removed, { type: 'restore', id: 'extensions' })
    expect(Object.values(statuses(restored)).every((s) => s === 'running')).toBe(true)
  })

  it('ignores actions that make no sense in the current phase', () => {
    expect(step(graph, initial, { type: 'stop' })).toBe(initial)
    expect(step(graph, initial, { type: 'remove', id: 'extensions' })).toBe(initial)
    expect(step(graph, step(graph, initial, { type: 'start' }), { type: 'start' }).phase).toBe('starting')
  })

  it('layers the diagram by dependency depth', () => {
    const layers = depths(graph)
    expect(layers.instance).toBe(0)
    expect(layers.extensions).toBe(1)
    expect(layers.builder).toBe(2)
  })
})
