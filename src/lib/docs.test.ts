import { describe, expect, it } from 'vitest'
import { flat, headingsOf, nav, neighbours, pages, parseNav, pathOfRoute, resolveLink, routeOf, titleOf } from './docs'
import { buildIndex, search } from './search'

describe('docs', () => {
  it('reads the navigation from the docs index and every entry has a page', () => {
    expect(nav.map((group) => group.title)).toEqual(['Getting started', 'Concepts', 'Guides', 'Reference', 'Architecture', 'Project'])
    expect(flat.length).toBeGreaterThan(25)
    for (const item of flat) expect(pages[item.path], item.path).toBeDefined()
  })

  it('parses group and item lines', () => {
    const groups = parseNav('## A\n\n- [One](a.md) - the first\n- [Two](missing.md)\n')
    expect(groups).toEqual([])
    expect(titleOf('# The `Title`\n\ntext')).toBe('The Title')
  })

  it('maps pages to routes and back', () => {
    expect(routeOf('concepts/plugins.md')).toBe('/docs/concepts/plugins')
    expect(pathOfRoute('concepts/plugins')).toBe('concepts/plugins.md')
    expect(pathOfRoute('concepts/nope')).toBeUndefined()
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
    expect(resolveLink('#anchor', 'concepts/plugins.md')).toEqual({ kind: 'anchor', href: '#anchor' })
    expect(resolveLink('../guides/errors.md#codes', 'concepts/plugins.md')).toEqual({ kind: 'internal', href: '/docs/guides/errors#codes' })
    expect(resolveLink('lifecycle.md', 'concepts/plugins.md').href).toBe('/docs/concepts/lifecycle')
    expect(resolveLink('https://example.com', 'status.md')).toEqual({ kind: 'external', href: 'https://example.com' })
    expect(resolveLink('../aimbrace_spec.md', 'getting-started/installation.md').href).toBe('https://github.com/aimbrace/aimbrace/blob/main/docs/aimbrace_spec.md')
  })
})

describe('search', () => {
  const index = buildIndex()

  it('indexes sections with anchors', () => {
    expect(index.length).toBeGreaterThan(100)
    expect(index.every((entry) => entry.href.startsWith('/docs/'))).toBe(true)
  })

  it('finds pages by heading, with all words matching', () => {
    const results = search(index, 'dependency graph')
    expect(results[0]?.page).toBe('concepts/dependency-graph.md')
    expect(search(index, 'zzzzqqq')).toEqual([])
    expect(search(index, '')).toEqual([])
  })

  it('finds an API by name', () => {
    expect(search(index, 'definePlugin').length).toBeGreaterThan(0)
    expect(search(index, 'E_MISSING_DEPENDENCY', 20).map((entry) => entry.page)).toContain('guides/errors.md')
  })
})
