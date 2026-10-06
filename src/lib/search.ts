import { headingsOf, pages, routeOf, titleOf } from './docs'
import { matchWord } from './fuzzy'

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

/**
 * Fuzzy search. Every query word must match somewhere in the section (title, heading or body), allowing typos for longer words.
 * Heading hits outrank title hits, which outrank body hits. Ties keep the docs order.
 */
export function search(index: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const words = query.toLowerCase().split(/[^\p{L}\p{N}_.]+/u).filter(Boolean)
  if (words.length === 0) return []
  return index
    .map((entry, order) => {
      const title = entry.pageTitle.toLowerCase()
      const heading = entry.heading.toLowerCase()
      const text = entry.text.toLowerCase()
      let score = 0
      for (const word of words) {
        const inHeading = matchWord(word, heading)
        const inTitle = matchWord(word, title)
        const inText = matchWord(word, text)
        const best = Math.max(inHeading * 6, inTitle * 3, inText)
        if (best === 0) return { entry, score: 0, order }
        score += best
      }
      // Reward sections where every word matched exactly in the heading or title, and penalise long bodies slightly.
      if (words.every((word) => matchWord(word, heading) === 1 || matchWord(word, title) === 1)) score += 2
      return { entry, score: score - Math.min(text.length, 4000) / 4000, order }
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((match) => match.entry)
}
