import { describe, expect, it } from 'vitest'
import { flat, headingsOf, nav, neighbours, pages, parseNav, pathOfRoute, resolveLink, routeOf, titleOf } from './docs'
import { buildIndex, search } from './search'

describe('docs', () => {
  it('reads the navigation from the docs index and every entry has a page', () => {
    expect(nav.map((group) => group.title)).toEqual(['Documentation'])
    expect(flat.map((item) => item.path)).toEqual(['getting-started.md', 'plugins.md', 'extending-apps.md', 'manifest.md', 'cordis.md'])
    for (const item of flat) expect(pages[item.path], item.path).toBeDefined()
  })

  it('parses group and item lines', () => {
    const groups = parseNav('## A\n\n- [One](a.md) - the first\n- [Two](missing.md)\n')
    expect(groups).toEqual([])
    expect(titleOf('# The `Title`\n\ntext')).toBe('The Title')
  })

  it('maps pages to routes and back', () => {
    expect(routeOf('extending-apps.md')).toBe('/docs/extending-apps')
    expect(pathOfRoute('extending-apps')).toBe('extending-apps.md')
    expect(pathOfRoute('nope')).toBeUndefined()
  })

  it('slugs headings like rehype-slug and skips code fences', () => {
    const headings = headingsOf('# T\n\n## First thing\n\n```\n## not a heading\n```\n\n### Second `code`\n\n## First thing\n')
    expect(headings.map((h) => h.id)).toEqual(['first-thing', 'second-code', 'first-thing-1'])
  })

  it('links neighbours in reading order', () => {
    const second = flat[1]
    expect(neighbours(second?.path ?? '').previous?.path).toBe(flat[0]?.path)
    expect(neighbours(flat[0]?.path ?? '').previous).toBeUndefined()
  })

  it('rewrites links: docs pages to the site, everything else to the repository', () => {
    expect(resolveLink('#anchor', 'plugins.md')).toEqual({ kind: 'anchor', href: '#anchor' })
    expect(resolveLink('manifest.md#the-lock', 'plugins.md')).toEqual({ kind: 'internal', href: '/docs/manifest#the-lock' })
    expect(resolveLink('https://example.com', 'plugins.md')).toEqual({ kind: 'external', href: 'https://example.com' })
    expect(resolveLink('../specs/000-roadmap/spec.md', 'plugins.md').href).toBe('https://github.com/aimbrace/aimbrace/blob/main/specs/000-roadmap/spec.md')
  })
})

describe('search', () => {
  const index = buildIndex()

  it('indexes sections with anchors', () => {
    expect(index.length).toBeGreaterThan(30)
    expect(index.every((entry) => entry.href.startsWith('/docs/'))).toBe(true)
  })

  it('finds pages by heading, with all words matching', () => {
    const results = search(index, 'durable task records')
    expect(results[0]?.page).toBe('plugins.md')
    expect(search(index, 'zzzzqqq')).toEqual([])
    expect(search(index, '')).toEqual([])
  })

  it('finds an API by name', () => {
    expect(search(index, 'package_plugin').length).toBeGreaterThan(0)
    expect(search(index, 'restoredPrevious', 20).map((entry) => entry.page)).toContain('extending-apps.md')
  })
})
