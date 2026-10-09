import { ArrowUpRight, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { REPOSITORY } from '@/lib/docs'
import { useOpenSearch } from './search'
import { ThemeToggle } from './theme-toggle'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/docs', label: 'Docs' },
  { to: '/explore', label: 'Explore' },
  { to: '/docs/plugins', label: 'Plugins' },
]

export function Logo({ size = 30 }: { size?: number }) {
  return <img src="/logo.png" alt="" width={size} height={size} className="logo-img" />
}

export function SiteHeader() {
  const openSearch = useOpenSearch()
  return (
    <header className="site-header">
      <div className="container-x" style={{ display: 'flex', alignItems: 'center', height: '3.7rem', gap: '1.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', fontSize: '0.82rem' }}>
          <Logo />
          AIMBRACE
        </Link>
        <nav aria-label="Primary" className="hidden md:flex" style={{ gap: '1.4rem', marginLeft: '1rem' }}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <button type="button" className="btn btn-sm hidden sm:inline-flex" onClick={openSearch} aria-label="Search the documentation" style={{ minWidth: '9rem', justifyContent: 'space-between', color: 'var(--ink-mute)', fontWeight: 500 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <Search size={14} /> Search
          </span>
          <span className="kbd">/</span>
        </button>
        <button type="button" className="btn btn-sm sm:hidden" onClick={openSearch} aria-label="Search" style={{ width: '2.1rem', padding: 0, justifyContent: 'center' }}>
          <Search size={15} />
        </button>
        <ThemeToggle />
        <a href={REPOSITORY} className="btn btn-sm hidden sm:inline-flex" target="_blank" rel="noreferrer">
          GitHub <ArrowUpRight size={12} />
        </a>
        <Link to="/docs/getting-started" className="btn btn-sm btn-primary">
          Quickstart
        </Link>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '3rem 0 2.5rem', background: 'var(--bg-sunken)' }}>
      <div className="container-x" style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', fontSize: '0.82rem' }}>
            <Logo size={26} /> AIMBRACE
          </div>
          <p style={{ color: 'var(--ink-mute)', fontSize: '0.85rem', maxWidth: '18rem' }}>A library of Cordis plugins extracted from ACRYL, copied into your app. MIT licensed.</p>
        </div>
        <FooterColumn title="Learn">
          <Link to="/docs/getting-started">Getting started</Link>
          <Link to="/docs/extending-apps">Extending a running app</Link>
          <Link to="/docs/manifest">The app manifest</Link>
          <Link to="/explore">Explore the plugins</Link>
        </FooterColumn>
        <FooterColumn title="Reference">
          <Link to="/docs/plugins">The plugin library</Link>
          <Link to="/docs/cordis">Building with Cordis</Link>
        </FooterColumn>
        <FooterColumn title="Project">
          <a href={REPOSITORY}>GitHub</a>
          <a href={`${REPOSITORY}/tree/main/specs`}>Specs</a>
          <a href="https://github.com/cordiverse/cordis">Cordis</a>
        </FooterColumn>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: '0.7rem' }}>{title}</div>
      <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>{children}</div>
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  )
}
