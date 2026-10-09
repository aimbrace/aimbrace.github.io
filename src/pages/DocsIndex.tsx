import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/chrome'
import { nav, routeOf } from '@/lib/docs'

export default function DocsIndex() {
  return (
    <Layout>
      <div className="grid-bg" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="container-x" style={{ padding: '4rem 1.25rem 3.2rem' }}>
          <div className="label label-accent">documentation</div>
          <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)' }}>Everything, in the order you need it.</h1>
          <p className="section-lede">
            Start with getting started, then the plugin library. The documented extension contract is installed by the framework's test suite, every Cordis example is run against the pinned Cordis, and every link is checked.
          </p>
          <div style={{ display: 'flex', gap: '0.7rem', marginTop: '1.6rem', flexWrap: 'wrap' }}>
            <Link to="/docs/getting-started" className="btn btn-primary">
              Getting started <ArrowRight size={15} />
            </Link>
            <Link to="/docs/plugins" className="btn">
              The plugin library
            </Link>
          </div>
        </div>
      </div>
      <div className="container-x" style={{ padding: '3rem 1.25rem 5rem', display: 'grid', gap: '2.5rem' }}>
        {nav.map((group) => (
          <section key={group.title}>
            <div className="label" style={{ marginBottom: '0.9rem' }}>{group.title}</div>
            <div style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: 'repeat(auto-fill, minmax(17rem, 1fr))' }}>
              {group.items.map((item) => (
                <Link key={item.path} to={routeOf(item.path)} className="card card-link">
                  <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{item.title}</div>
                  <div style={{ color: 'var(--ink-mute)', fontSize: '0.86rem' }}>{item.description}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  )
}
