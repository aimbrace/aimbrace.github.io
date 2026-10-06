import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Layout } from '@/components/chrome'
import { Markdown } from '@/components/markdown'
import { headingsOf, nav, neighbours, pageOf, REPOSITORY, routeOf, titleOf } from '@/lib/docs'
import NotFound from './NotFound'

export default function DocPage() {
  const splat = useParams()['*'] ?? ''
  const { pathname, hash } = useLocation()
  const path = pageOf(splat)

  useEffect(() => {
    if (!path) return
    document.title = `${titleOf(path.markdown)} - AIMBRACE docs`
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash, path])

  if (!path) return <NotFound />
  const headings = headingsOf(path.markdown)
  const { previous, next } = neighbours(path.path)
  return (
    <Layout>
      <div className="container-x" style={{ padding: '2.4rem 1.25rem 5rem' }}>
        <div className="docs-grid">
          <aside className="side-nav hidden lg:block" style={{ position: 'sticky', top: '5rem', alignSelf: 'start', maxHeight: 'calc(100vh - 6.5rem)', overflowY: 'auto', paddingBottom: '2rem' }}>
            {nav.map((group) => (
              <div key={group.title} style={{ marginBottom: '1.3rem' }}>
                <div className="label" style={{ marginBottom: '0.4rem' }}>{group.title}</div>
                {group.items.map((item) => (
                  <Link key={item.path} to={routeOf(item.path)} aria-current={item.path === path.path ? 'page' : undefined}>
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </aside>
          <article style={{ minWidth: 0 }}>
            <div className="label" style={{ marginBottom: '0.8rem' }}>{path.path.replace(/\.md$/, '').replace(/\//g, ' / ')}</div>
            <Markdown from={path.path}>{path.markdown}</Markdown>
            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '3rem 0 1.4rem' }} />
            <div style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: '1fr 1fr' }}>
              {previous ? (
                <Link to={routeOf(previous.path)} className="card card-link">
                  <div className="label"><ArrowLeft size={11} style={{ display: 'inline' }} /> previous</div>
                  <div style={{ fontWeight: 700 }}>{previous.title}</div>
                </Link>
              ) : <span />}
              {next ? (
                <Link to={routeOf(next.path)} className="card card-link" style={{ textAlign: 'right' }}>
                  <div className="label">next <ArrowRight size={11} style={{ display: 'inline' }} /></div>
                  <div style={{ fontWeight: 700 }}>{next.title}</div>
                </Link>
              ) : null}
            </div>
            <p style={{ marginTop: '1.4rem' }}>
              <a className="label" href={`${REPOSITORY}/edit/main/docs/${path.path}`} target="_blank" rel="noreferrer">
                <Pencil size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> edit this page on GitHub
              </a>
            </p>
          </article>
          {headings.length > 1 ? (
            <aside className="toc hidden xl:block" style={{ position: 'sticky', top: '5rem', alignSelf: 'start' }}>
              <div className="label" style={{ marginBottom: '0.6rem' }}>on this page</div>
              {headings.map((heading) => (
                <a key={heading.id} href={`#${heading.id}`} style={{ paddingLeft: heading.depth === 3 ? '1.6rem' : undefined }}>
                  {heading.text}
                </a>
              ))}
            </aside>
          ) : null}
        </div>
      </div>
    </Layout>
  )
}
