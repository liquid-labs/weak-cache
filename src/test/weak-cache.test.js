/* global afterEach beforeEach describe expect test */

import { WeakCache } from '../weak-cache'

describe('WeakCache', () => {
  let cache
  beforeEach(() => { cache = new WeakCache({ cleanupInterval : 500 }) })
  afterEach(() => cache.release())

  test.each(['a string', 1, { foo : 'bar' }])("will store and retrieve '%p'", (value) => {
    cache.put('a', value)
    expect(cache.get('a')).toBe(value)
  })

  /* test('is iterable', () => {
    const data = [ ['a', 1], ['b', 'a string'], ['c', { a: 1}]]
    for (const [key, value] of data) {
      cache.put(key, value)
    }

    let iterations = 0
    for (const [key, value] of cache) {
      const [eKey, eValue] = data[iterations]

      expect(key).toBe(eKey)
      expect(value).toBe(eValue)

      iterations += 1
    }

    expect(iterations).toBe(3)
  }) */

  describe('has', () => {
    test("is 'false' when key does not exist", () => expect(cache.has('a')).toBe(false))

    test.each(['a string', 1, { foo : 'bar' }])("works with value '%p'", (value) => {
      cache.put('a', value)
      expect(cache.has('a')).toBe(true)
    })
  })

  describe('get', () => {
    test("clears 'undefined' entries after 'get'", () => {
      expect(cache.size).toBe(0)
      cache.put('a', undefined)
      expect(cache.size).toBe(1)
      expect(cache.get('a')).toBe(undefined)
      expect(cache.size).toBe(0)
    })
  })

  describe('delete', () => {
    test('will safely "delete" non-entry', () => expect(cache.delete('a')).toBe(undefined))
  })

  describe('keys', () => {
    const data = [['a', 1], ['b', 'a string'], ['c', { a : 1 }]]
    beforeEach(() => {
      for (const [key, value] of data) {
        cache.put(key, value)
      }
    })

    test('returns an iterator', () => {
      let iterations = 0
      for (const key of cache.keys()) {
        const [eKey, eValue] = data[iterations]

        expect(key).toBe(eKey)
        expect(cache.get(key)).toBe(eValue)

        iterations += 1
      }

      expect(iterations).toBe(3)
    })
  })
})
