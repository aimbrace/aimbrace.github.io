#!/usr/bin/env node
/**
 * Copy the documentation and the real plugin graph out of a checkout of github.com/aimbrace/aimbrace into src/content.
 *
 *   node scripts/sync-from-aimbrace.mjs [--source ../aimbrace]
 *
 * The graph is built from the framework's own data: every `plugins/<name>/plugin.json` states the services it `provides` and
 * `inject`s, and `packages/cli/templates/agent/template.json` lists the plugins an agent app is made of (with what they require).
 * Nothing needs building. The result is committed, so the site builds without the framework repository.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const root = resolve(import.meta.dirname, '..')
const { values } = parseArgs({ options: { source: { type: 'string', default: resolve(root, '..', 'aimbrace') } } })
const source = resolve(values.source)
const docs = join(source, 'docs')
if (!existsSync(docs)) throw new Error(`No docs folder in ${source}. Pass --source <aimbrace checkout>.`)

// 1. the documentation
const target = join(root, 'src', 'content', 'docs')
rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })
let copied = 0
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (['test', '.generated', 'assets', 'node_modules'].includes(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.md')) {
      const out = join(target, path.slice(docs.length + 1))
      mkdirSync(dirname(out), { recursive: true })
      cpSync(path, out)
      copied++
    }
  }
}
walk(docs)

// 2. the plugin graph of the agent template
const library = new Map()
for (const name of readdirSync(join(source, 'plugins'))) {
  const manifest = join(source, 'plugins', name, 'plugin.json')
  if (existsSync(manifest)) library.set(name, JSON.parse(readFileSync(manifest, 'utf8')))
}
const template = JSON.parse(readFileSync(join(source, 'packages', 'cli', 'templates', 'agent', 'template.json'), 'utf8'))
const chosen = []
const take = (name) => {
  const plugin = library.get(name)
  if (!plugin) throw new Error(`template lists "${name}", which is not in the library`)
  if (chosen.includes(name)) return
  for (const required of plugin.requires ?? []) take(required)
  chosen.push(name)
}
for (const name of template.plugins) take(name)

const providerOf = (service, consumer) => chosen.find((name) => name !== consumer && (library.get(name).provides ?? []).includes(service))
const edges = []
for (const name of chosen) {
  for (const service of library.get(name).inject ?? []) {
    const provider = providerOf(service, name)
    if (provider && !edges.some((edge) => edge.from === provider && edge.to === name && edge.service === service)) {
      edges.push({ from: provider, to: name, service, optional: false })
    }
  }
}
// Install order: a plugin after every plugin it injects from; ties keep the template's order.
const order = []
const placed = new Set()
while (order.length < chosen.length) {
  const next = chosen.find((name) => !placed.has(name) && edges.filter((edge) => edge.to === name).every((edge) => placed.has(edge.from)))
  if (!next) throw new Error('the agent template has a dependency cycle')
  order.push(next)
  placed.add(next)
}
const nodes = order.map((name, index) => ({
  id: name,
  description: library.get(name).description,
  requires: library.get(name).inject ?? [],
  optional: [],
  provides: library.get(name).provides ?? [],
  index,
}))
const commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

writeFileSync(join(root, 'src', 'content', 'agent-graph.json'), `${JSON.stringify({ name: 'the agent template', graph: { ok: true, nodes, edges, order } }, null, 2)}\n`)
writeFileSync(join(root, 'src', 'content', 'source.json'), `${JSON.stringify({ repository: 'aimbrace/aimbrace', commit }, null, 2)}\n`)
console.log(`synced ${copied} docs pages and the agent template graph (${nodes.length} plugins, ${edges.length} edges) from ${commit.slice(0, 7)}`)
