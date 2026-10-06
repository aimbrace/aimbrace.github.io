import GithubSlugger from 'github-slugger'

/** Every synced docs page, keyed by its path inside docs/ (for example `concepts/plugins.md`). */
const raw = import.meta.glob('/src/content/docs/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export const pages: Record<string, string> = Object.fromEntries(
  Object.entries(raw).map(([path, text]) => [path.replace('/src/content/docs/', ''), text]),
)

export const REPOSITORY = 'https://github.com/aimbrace/aimbrace'

/** The first `# heading` of a page. */
export function titleOf(markdown: string): string {
  return /^#\s+(.+)$/m.exec(markdown)?.[1]?.replace(/`/g, '') ?? 'Untitled'
}

export interface NavItem {
  title: string
  path: string
  description: string
}
export interface NavGroup {
  title: string
  items: NavItem[]
}

/**
 * The navigation, read from `docs/README.md`: `##` headings are groups and `- [Title](path) - description` lines are pages. The docs
 * index is the single source of truth for what exists, and a docs test in the framework repository keeps it complete.
 */
export function parseNav(readme: string): NavGroup[] {
  const groups: NavGroup[] = []
  let current: NavGroup | undefined
  for (const line of readme.split('\n')) {
    const heading = /^##\s+(.+)$/.exec(line)
    if (heading) {
      current = { title: heading[1] as string, items: [] }
      groups.push(current)
      continue
    }
    const item = /^-\s+\[([^\]]+)\]\(([^)]+\.md)\)(?:\s+-\s+(.*))?$/.exec(line)
    if (item && current && pages[item[2] as string] !== undefined) {
      current.items.push({ title: item[1] as string, path: item[2] as string, description: item[3] ?? '' })
    }
  }
  return groups.filter((group) => group.items.length > 0)
}

export const nav: NavGroup[] = parseNav(pages['README.md'] ?? '')
export const flat: NavItem[] = nav.flatMap((group) => group.items)

/** `concepts/plugins.md` -> `/docs/concepts/plugins`. */
export const routeOf = (path: string): string => `/docs/${path.replace(/\.md$/, '')}`

/** The page for a route splat (`concepts/plugins`), with its markdown; `undefined` when there is no such page. */
export function pageOf(splat: string): { path: string; markdown: string } | undefined {
  const path = pathOfRoute(splat)
  return path === undefined ? undefined : { path, markdown: pages[path] as string }
}

/** The inverse of {@link routeOf}; `undefined` when no such page exists. */
export function pathOfRoute(splat: string): string | undefined {
  const path = `${splat.replace(/\/$/, '')}.md`
  return pages[path] === undefined ? undefined : path
}

export interface Heading {
  depth: number
  text: string
  id: string
}

/** Headings of a page (outside code fences), with the same ids `rehype-slug` gives them. */
export function headingsOf(markdown: string, depths = [2, 3]): Heading[] {
  const slugger = new GithubSlugger()
  const found: Heading[] = []
  let fenced = false
  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced
    const match = !fenced && /^(#{1,6})\s+(.*)$/.exec(line)
    if (!match) continue
    const text = (match[2] as string).replace(/`/g, '').trim()
    const id = slugger.slug(text)
    if (depths.includes((match[1] as string).length)) found.push({ depth: (match[1] as string).length, text, id })
  }
  return found
}

/** Previous and next page in reading order. */
export function neighbours(path: string): { previous?: NavItem; next?: NavItem } {
  const index = flat.findIndex((item) => item.path === path)
  if (index === -1) return {}
  const previous = flat[index - 1]
  const next = flat[index + 1]
  return { ...(previous ? { previous } : {}), ...(next ? { next } : {}) }
}

/**
 * Resolve a link found in a docs page. Docs links go to the site; links that leave the docs folder go to the repository.
 */
export function resolveLink(href: string, from: string): { kind: 'anchor' | 'internal' | 'external'; href: string } {
  if (/^(https?:|mailto:)/.test(href)) return { kind: 'external', href }
  if (href.startsWith('#')) return { kind: 'anchor', href }
  const [target = '', anchor] = href.split('#') as [string, string | undefined]
  const segments = from.split('/').slice(0, -1)
  for (const part of target.split('/')) {
    if (part === '..') segments.pop()
    else if (part !== '.' && part !== '') segments.push(part)
  }
  const resolved = segments.join('/')
  if (target.endsWith('.md') && pages[resolved] !== undefined) {
    return { kind: 'internal', href: `${routeOf(resolved)}${anchor ? `#${anchor}` : ''}` }
  }
  // Outside docs/ (or a page that is not published here): the repository, relative to the docs folder.
  const climbed = from.split('/').slice(0, -1).length - target.split('/').filter((part) => part === '..').length
  const repoPath = climbed < 0 ? resolved : `docs/${resolved}`
  return { kind: 'external', href: `${REPOSITORY}/blob/main/${repoPath.replace(/^\/+/, '')}` }
}
