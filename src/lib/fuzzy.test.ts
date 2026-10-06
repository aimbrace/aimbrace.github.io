import { describe, expect, it } from 'vitest'
import { allowedTypos, editDistance, matchWord } from './fuzzy'
import { buildIndex, search } from './search'

describe('editDistance', () => {
  it('counts single-character edits', () => {
    expect(editDistance('plugin', 'plugn')).toBe(1)
    expect(editDistance('scope', 'scopes')).toBe(1)
    expect(editDistance('kitten', 'sitting')).toBe(3)
    expect(editDistance('same', 'same')).toBe(0)
  })

  it('gives up early past the limit', () => {
    expect(editDistance('aaaaaa', 'bbbbbbbbbb', 2)).toBe(3)
  })
})

describe('matchWord', () => {
  it('scores exact words above prefixes above substrings', () => {
    expect(matchWord('plugin', 'the plugin graph')).toBe(1)
    expect(matchWord('plug', 'the plugin graph')).toBe(0.9)
    expect(matchWord('ugin', 'the plugin graph')).toBe(0.75)
  })

  it('tolerates typos in longer words only', () => {
    expect(matchWord('definplugin', 'defineplugin signature')).toBeGreaterThan(0)
    expect(matchWord('schedular', 'scheduler')).toBeGreaterThan(0)
    expect(matchWord('ab', 'ac')).toBe(0)
    expect(matchWord('zzzzzzz', 'plugin graph')).toBe(0)
  })

  it('gives typo matches less weight than exact ones', () => {
    expect(matchWord('lifecyle', 'lifecycle')).toBeLessThan(matchWord('lifecycle', 'lifecycle'))
    expect(matchWord('lifecyle', 'lifecycle')).toBeGreaterThan(0)
  })

  it('budgets typos by length', () => {
    expect([allowedTypos('abc'), allowedTypos('abcdef'), allowedTypos('abcdefghijk')]).toEqual([0, 1, 2])
  })
})

describe('fuzzy search over the docs', () => {
  const index = buildIndex()

  it('finds a section despite a typo in the query', () => {
    const results = search(index, 'lifecyle stop', 5)
    expect(results.map((entry) => entry.page)).toContain('concepts/lifecycle.md')
  })

  it('finds an API name with a typo', () => {
    expect(search(index, 'definplugin', 5).length).toBeGreaterThan(0)
  })

  it('still ranks exact heading matches first', () => {
    expect(search(index, 'dependency graph')[0]?.page).toBe('concepts/dependency-graph.md')
  })

  it('returns nothing for nonsense and for an empty query', () => {
    expect(search(index, 'qxqxqxqxq')).toEqual([])
    expect(search(index, '   ')).toEqual([])
  })
})
