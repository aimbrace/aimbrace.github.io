/** Edit distance between two strings, with an early exit once it exceeds `limit`. */
export function editDistance(a: string, b: string, limit = Number.POSITIVE_INFINITY): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const value = Math.min((previous[j] as number) + 1, (current[j - 1] as number) + 1, (previous[j - 1] as number) + cost)
      current[j] = value
      rowMin = Math.min(rowMin, value)
    }
    if (rowMin > limit) return limit + 1
    previous = current
  }
  return previous[b.length] as number
}

/** Typos a query word may have before it stops matching: none for short words, one or two for longer ones. */
export function allowedTypos(word: string): number {
  if (word.length < 4) return 0
  if (word.length < 8) return 1
  return 2
}

/**
 * How well `word` matches inside `text` (both lower case). 1 for an exact word, 0.9 for a prefix, 0.75 for a substring, a
 * lower score for a word within the typo budget, and 0 for no match. Typos are checked against each word of the text and
 * against its prefixes, so `definplugin` finds `definePlugin` and `schedular` finds `scheduler`.
 */
export function matchWord(word: string, text: string): number {
  if (!word) return 0
  if (text.includes(word)) {
    const words = text.split(/[^\p{L}\p{N}]+/u)
    if (words.includes(word)) return 1
    if (words.some((candidate) => candidate.startsWith(word))) return 0.9
    return 0.75
  }
  const budget = allowedTypos(word)
  if (budget === 0) return 0
  let best = Number.POSITIVE_INFINITY
  for (const candidate of text.split(/[^\p{L}\p{N}]+/u)) {
    if (candidate.length < 3) continue
    const distance = editDistance(word, candidate, budget)
    const prefixDistance = candidate.length > word.length ? editDistance(word, candidate.slice(0, word.length), budget) : Number.POSITIVE_INFINITY
    best = Math.min(best, distance, prefixDistance)
  }
  if (best > budget) return 0
  return 0.6 - best * 0.15
}
