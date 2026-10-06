import { headingsOf, pages, routeOf, titleOf } from './docs'

export interface SearchEntry {
  page: string
  pageTitle: string
  heading: string
  id: string
  href: string
  text: string
}

/** One entry per heading section of every page: title, heading and body text, without code fences. */
export function buildIndex(source: Record<string, string> = pages): SearchEntry[] {
  const entries: SearchEntry[] = []
  for (const [path, markdown] of Object.entries(source)) {
    if (path === 'README.md') continue
    const pageTitle = titleOf(markdown)
    const lines = markdown.replace(/```[\s\S]*?```/g, ' ').split('\n')
    let heading = pageTitle
    let id = ''
    let body: string[] = []
    const flush = () => {
      const text = body.join(' ').replace(/[`*>|#]/g, ' ').replace(/\s+/g, ' ').trim()
      if (text) entries.push({ page: path, pageTitle, heading, id, href: `${routeOf(path)}${id ? `#${id}` : ''}`, text })
      body = []
    }
    const ids = new Map(headingsOf(markdown, [2, 3]).map((h) => [h.text, h.id]))
    for (const line of lines) {
      const match = /^(#{2,3})\s+(.*)$/.exec(line)
      if (match) {
        flush()
        heading = (match[2] as string).replace(/`/g, '').trim()
        id = ids.get(heading) ?? ''
      } else if (!/^#\s/.test(line)) {
        body.push(line)
      }
    }
    flush()
  }
  return entries
}

/** Every word must match; heading and page-title hits outrank body hits. */
export function search(index: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return index
    .map((entry) => {
      const title = entry.pageTitle.toLowerCase()
      const heading = entry.heading.toLowerCase()
      const text = entry.text.toLowerCase()
      let score = 0
      for (const word of words) {
        const inTitle = title.includes(word)
        const inHeading = heading.includes(word)
        const inText = text.includes(word)
        if (!inTitle && !inHeading && !inText) return { entry, score: 0 }
        score += (inHeading ? 6 : 0) + (inTitle ? 3 : 0) + (inText ? 1 : 0)
      }
      return { entry, score }
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((match) => match.entry)
}
