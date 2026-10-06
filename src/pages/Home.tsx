import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/chrome'
import { GraphExplorer } from '@/components/graph-explorer'

const pillars = [
  { k: '01', t: 'A typed graph', d: 'Plugins declare what they require and provide. Missing services, cycles and duplicate providers fail before anything runs.' },
  { k: '02', t: 'Deterministic lifecycle', d: 'Install in dependency order, start, stop in reverse, roll back on failure, reactivate dependents when a provider returns.' },
  { k: '03', t: 'A scope per task', d: 'Every request or agent run gets its own context: a signal, local services, and everything released when it ends.' },
  { k: '04', t: 'One plugin, many hosts', d: 'The same plugins serve HTTP on Hono or Fastify, a CLI, Effect programs and a build step.' },
]

const code = `const greeter = definePlugin({
  id: 'greeter',
  requires: [Settings],   // what it needs
  provides: [Greeter],    // what it offers
  setup(ctx) {
    const { name } = ctx.get(Settings) // only declared services type-check
    ctx.provide(Greeter, { greet: (who) => \`Hello \${who} from \${name}\` })
  },
})

const app = createApp({ plugins: [greeter, settings] }) // order does not matter
await app.start()
await app.stop()
app.probe().clean // true: nothing leaked`

export default function Home() {
  return (
    <Layout>
      <section className="grid-bg" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="container-x" style={{ padding: '5rem 1.25rem 4.5rem', display: 'grid', gap: '3rem', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', alignItems: 'center' }}>
          <div>
            <div className="label label-accent">TypeScript · built on Cordis · v0.1.0</div>
            <h1 style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)', lineHeight: 1.02, letterSpacing: '-0.035em', fontWeight: 800, margin: '1rem 0 1.2rem' }}>
              Compose apps from plugins. <span className="gradient-text">Let the graph do the rest.</span>
            </h1>
            <p className="section-lede" style={{ fontSize: '1.12rem' }}>
              AIMBRACE is a composition runtime, not another plugin framework. Each plugin states what it needs and offers. The runtime orders, scopes, starts,
              stops and cleans up, and proves nothing leaked.
            </p>
            <div style={{ display: 'flex', gap: '0.7rem', marginTop: '1.8rem', flexWrap: 'wrap' }}>
              <Link to="/docs/getting-started/quickstart" className="btn btn-primary">
                Quickstart <ArrowRight size={15} />
              </Link>
              <Link to="/explore" className="btn">
                Explore the lifecycle
              </Link>
            </div>
            <p className="label" style={{ marginTop: '1.6rem' }}>MIT · not on npm yet · install from the repository</p>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="label" style={{ padding: '0.7rem 1rem', borderBottom: '1px solid var(--line)' }}>app.ts</div>
            <pre className="mono" style={{ margin: 0, padding: '1.1rem', fontSize: '0.78rem', lineHeight: 1.7, overflowX: 'auto', color: 'var(--ink-soft)' }}>{code}</pre>
          </div>
        </div>
      </section>

      <section className="container-x section">
        <div className="label label-accent">why</div>
        <h2 className="section-title">Four ideas, one runtime.</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', marginTop: '2rem' }}>
          {pillars.map((p) => (
            <div key={p.k} className="card">
              <div className="label label-accent">{p.k}</div>
              <div style={{ fontWeight: 750, fontSize: '1.1rem', margin: '0.5rem 0' }}>{p.t}</div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', margin: 0 }}>{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x" style={{ paddingBottom: '5rem' }}>
        <div className="label label-accent">the real graph</div>
        <h2 className="section-title">The agent example, live.</h2>
        <p className="section-lede">Seven plugins from <code>examples/agent-cli</code>, exported by the framework's own CLI at build time.</p>
        <div style={{ marginTop: '1.8rem' }}>
          <GraphExplorer compact />
        </div>
      </section>

      <section className="container-x" style={{ paddingBottom: '6rem' }}>
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', alignItems: 'center', justifyContent: 'space-between', padding: '2rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>Read it, run it, then build your own.</div>
            <p style={{ color: 'var(--ink-soft)', margin: '0.4rem 0 0' }}>The quickstart runs in about ten minutes. Every snippet in the docs is tested.</p>
          </div>
          <Link to="/docs/getting-started/quickstart" className="btn btn-primary">
            Start the quickstart <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </Layout>
  )
}
