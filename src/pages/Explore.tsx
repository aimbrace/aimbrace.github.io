import { Layout } from '@/components/chrome'
import { GraphExplorer } from '@/components/graph-explorer'

export default function Explore() {
  return (
    <Layout>
      <div className="grid-bg" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="container-x" style={{ padding: '3.4rem 1.25rem 2.6rem' }}>
          <div className="label label-accent">explore</div>
          <h1 className="section-title">Watch the lifecycle happen.</h1>
          <p className="section-lede">
            This is the agent example's real plugin graph, exported by the framework's CLI. Start the app to see plugins install in dependency order, remove a
            provider to watch its dependents go pending, and stop to see reverse teardown.
          </p>
        </div>
      </div>
      <div className="container-x" style={{ padding: '2.5rem 1.25rem 5rem' }}>
        <GraphExplorer />
      </div>
    </Layout>
  )
}
