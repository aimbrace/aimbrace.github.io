import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/chrome'
import { GraphExplorer } from '@/components/graph-explorer'

const pillars = [
  { k: '01', t: 'The plugin is the unit', d: 'Every capability is a Cordis plugin, including the ones your agent writes. Plugins declare what they inject, provide a service, and clean up after themselves.' },
  { k: '02', t: 'An agent that builds its own app', d: 'It writes a plugin into the running app, installs it, reads the real state, and fixes what failed. A failed update keeps the previous version running.' },
  { k: '03', t: 'Copy it, do not import it', d: 'There is no AIMBRACE runtime. The command copies plugins into your app. You own every line, and nothing updates underneath you.' },
  { k: '04', t: 'The app as data', d: 'aimbrace.yaml lists the plugins, their config and parameters, with a lock of digests. Save it with git; a file holding a secret is refused.' },
]

const code = `// extensions/clock/index.ts - written by the agent, installed into the running app
import type { Context } from '@deepseek-ai/cordis'

export const name = 'clock'
export const inject = ['http']          // waits (pending) until the router exists

export function apply(ctx: Context) {
  const http = ctx.get('http') as Router
  ctx.effect(() => http.route('GET', '/time', () => ({ body: { time: new Date().toISOString() } })))
}                                        // in ctx.effect: removed with the plugin

export async function check(ctx: Context) {   // must pass, or the install is rolled back
  const reply = await (ctx.get('http') as Router).handle({ method: 'GET', path: '/time', body: undefined })
  if (reply.status !== 200) throw new Error('GET /time failed')
}`

export default function Home() {
  return (
    <Layout>
      <section className="grid-bg" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="container-x" style={{ padding: '5rem 1.25rem 4.5rem', display: 'grid', gap: '3rem', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', alignItems: 'center' }}>
          <div>
            <div className="label label-accent">Built on Cordis · extracted from ACRYL</div>
            <h1 style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)', lineHeight: 1.02, letterSpacing: '-0.035em', fontWeight: 800, margin: '1rem 0 1.2rem' }}>
              Apps made of plugins. <span className="gradient-text">Let the agent write them.</span>
            </h1>
            <p className="section-lede" style={{ fontSize: '1.12rem' }}>
              AIMBRACE is a library of Cordis plugins extracted from ACRYL, and a command that copies them into your app: live install with rollback, an agent that builds the app it runs in, durable task records, settings, the app as a manifest. Cordis is the framework; you own the code.
            </p>
            <div style={{ display: 'flex', gap: '0.7rem', marginTop: '1.8rem', flexWrap: 'wrap' }}>
              <Link to="/docs/getting-started" className="btn btn-primary">
                Quickstart <ArrowRight size={15} />
              </Link>
              <Link to="/explore" className="btn">
                Explore the plugins
              </Link>
            </div>
            <p className="label" style={{ marginTop: '1.6rem' }}>MIT · not on npm · install from the repository</p>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="label" style={{ padding: '0.7rem 1rem', borderBottom: '1px solid var(--line)' }}>extensions/clock/index.ts</div>
            <pre className="mono" style={{ margin: 0, padding: '1.1rem', fontSize: '0.78rem', lineHeight: 1.7, overflowX: 'auto', color: 'var(--ink-soft)' }}>{code}</pre>
          </div>
        </div>
      </section>

      <section className="container-x section">
        <div className="label label-accent">why</div>
        <h2 className="section-title">Four ideas, no runtime.</h2>
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
        <h2 className="section-title">The agent app, live.</h2>
        <p className="section-lede">The plugins of the agent template and the services they inject, read from the framework's own plugin data. Remove a provider and watch its dependents wait.</p>
        <div style={{ marginTop: '1.8rem' }}>
          <GraphExplorer compact />
        </div>
      </section>

      <section className="container-x" style={{ paddingBottom: '6rem' }}>
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', alignItems: 'center', justifyContent: 'space-between', padding: '2rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>Read it, run it, then build your own.</div>
            <p style={{ color: 'var(--ink-soft)', margin: '0.4rem 0 0' }}>Create an app, ask its agent to extend it, save it. The documented extension contract is installed by the test suite.</p>
          </div>
          <Link to="/docs/getting-started" className="btn btn-primary">
            Start the quickstart <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </Layout>
  )
}
