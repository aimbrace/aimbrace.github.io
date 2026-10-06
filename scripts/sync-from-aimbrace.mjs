#!/usr/bin/env node
/**
 * Copy the documentation and a real plugin graph out of a checkout of github.com/aimbrace/aimbrace into src/content.
 *
 *   node scripts/sync-from-aimbrace.mjs [--source ../aimbrace]
 *
 * The source checkout must be built (`pnpm install && pnpm run build` there): the graph comes from its CLI run on
 * examples/agent-cli. The result is committed, so the site builds without the framework repository.
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

const target = join(root, 'src', 'content', 'docs')
rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })

let copied = 0
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (['test', '.generated', 'assets', 'node_modules'].includes(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.md') && name !== 'aimbrace_spec.md') {
      const out = join(target, path.slice(docs.length + 1))
      mkdirSync(dirname(out), { recursive: true })
      cpSync(path, out)
      copied++
    }
  }
}
walk(docs)

const cli = join(source, 'packages', 'cli', 'bin', 'aimbrace.js')
if (!existsSync(join(source, 'packages', 'cli', 'dist', 'index.js'))) throw new Error('Build the aimbrace repository first (pnpm run build).')
const graphJson = execFileSync(process.execPath, [cli, 'graph', '--format', 'json', '--cwd', join(source, 'examples', 'agent-cli')], { encoding: 'utf8' })
const graph = JSON.parse(graphJson)
const mermaid = execFileSync(process.execPath, [cli, 'graph', '--format', 'mermaid', '--cwd', join(source, 'examples', 'agent-cli')], { encoding: 'utf8' })
const commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

writeFileSync(join(root, 'src', 'content', 'agent-graph.json'), `${JSON.stringify({ name: 'examples/agent-cli', graph, mermaid }, null, 2)}\n`)
writeFileSync(join(root, 'src', 'content', 'source.json'), `${JSON.stringify({ repository: 'aimbrace/aimbrace', commit }, null, 2)}\n`)
console.log(`synced ${copied} docs pages and the agent graph (${graph.nodes.length} plugins) from ${commit.slice(0, 7)}`)
