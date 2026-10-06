import { Link } from 'react-router-dom'
import { Layout } from '@/components/chrome'

export default function NotFound() {
  return (
    <Layout>
      <div className="container-x" style={{ padding: '7rem 1.25rem', textAlign: 'center' }}>
        <div className="label label-accent">404</div>
        <h1 className="section-title">This page is not in the graph.</h1>
        <p className="section-lede" style={{ margin: '0 auto 2rem' }}>Nothing provides it. Try the documentation index.</p>
        <Link to="/docs" className="btn btn-primary">
          Open the docs
        </Link>
      </div>
    </Layout>
  )
}
