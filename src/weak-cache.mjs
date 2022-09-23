/**
* WeakCache implements a cache with weakly referenced _values_. Therefore, values in the cache can be garbage
* collected. Note, however, that _keys_ are not weakly referenced and using an object as a key will keep that object
* in scope and prevent it from being gc'ed.
*
* When using WeakCacheh with a cleanup interval (see constructor), you must be sure and call `WeakMap.release()` in
* order to exit the main thread. If `release()` is not called, your process will likely hang on exit.
*/

const WeakCache = class {
  /**
  * Underlying Map holding cached values.
  */
  #cache
  /**
  * A callback handler (usually) called whenever an cache value is gargbage collected.
  */
  #globalFinalizationCallback
  /**
  * See `constructor.primitivesAlwaysHard`.
  */
  #primitivesAlwaysHard
  /**
  * A reference to the interval cleanup timer. May be `undefined`.
  */
  #intervalRef
  /**
  * Caches the size (i.e., number of keys) in the cache.
  */
  #size

  /**
  * Creates a WeakCache.
  *
  * #### Parameters
  *
  * - `cleanupInterval`: time in milliseconds between 'clean up' attempts. Default to 60 sec. Passing in `false` (and
  *    only `false`) will cause the cache to rely on external management.
  * - `globalFinalizationCallback`: callback which (usually) will be called when a value is gc'ed.
  * - `primitivesAlwaysHard`: if `true`, then primitives are always saved as a 'hard' reference. Otherwise, and by default, primitive values are 'wrapped' enabling the cache entry to be cleared by gc.
  */
  constructor({ globalFinalizationCallback, cleanupInterval = 60 * 1000, primitivesAlwaysHard = false } = {}) {
    this.#cache = new Map()
    this.#globalFinalizationCallback = globalFinalizationCallback
    this.#primitivesAlwaysHard = primitivesAlwaysHard

    if (cleanupInterval !== false) {
      this.#intervalRef = setInterval(() => this._cleanUp(), cleanupInterval)
    }

    this.#size = 0
  }

  /**
  * Adds or update a value in the cache.
  *
  * #### Arguments
  *
  * - `key`: the key used to retrieve the cache value. May be anything
  * - `value`: the value to hold. Can be anyithng.
  */
  put(key, value, { finalizationCallback, hardRef = false } = {}) {
    if (key === undefined) {
      throw new Error("WeakCache does not support 'undefined' keys.")
    }

    const addOne = this.has(key) === false

    try {
      const valueType = typeof value
      const isPrimitive = !(valueType === 'object' || valueType === 'function' || value === null)

      if (hardRef !== true && !isPrimitive) {
        if (finalizationCallback !== undefined || this.#globalFinalizationCallback !== undefined) {
          const globalFinalizationCallback = this.#globalFinalizationCallback
          const fc = finalizationCallback !== undefined && this.#globalFinalizationCallback !== undefined
            ? (value) => { globalFinalizationCallback(value); finalizationCallback(value) }
            : finalizationCallback || globalFinalizationCallback

          const fr = new FinalizationRegistry(fc)
          fr.register(value)
        }

        this.#cache.set(key, { isRef : true, value : new WeakRef(value) })
      }
      else if (hardRef === true
                || (isPrimitive && this.#primitivesAlwaysHard === true)) { // 'isPrimitive' redundant; clarifies
        this.#cache.set(key, { isRef : false, value : value })
      }
      else { // it's a primitive value but we want it weakly reffed.
        this.#cache.set(key, { isRef : true, isPrimitive : true, value : new WeakRef({ value }) })
      }

      return value
    }
    finally {
      if (addOne) this.#size += 1
    }
  }

  get(key) {
    const value = this._getHelper(key)

    if (value === undefined) {
      this.delete(key)
    }

    return value
  }

  // TODO: make this private
  /**
  * Break out the actual retrieval to avoid an infinite loop between 'get' and 'delete'
  */
  _getHelper(key) {
    const valueSpec = this.#cache.get(key)
    if (valueSpec === undefined) return undefined

    const object = valueSpec.isRef
      ? valueSpec.value.deref()
      : valueSpec.value

    return valueSpec.isPrimitive === true
      ? object.value
      : object
  }

  has(key) { return this.#cache.has(key) }

  get size() { return this.#size }

  delete(key) {
    if (this.has(key)) {
      const deleted = this.#cache.delete(key)
      this.#size -= 1
      return deleted
    }
    return undefined
  }

  keys() {
    return this.#cache.keys()
  }

  /* Why doesn't this work?
  [Symbol.iterator] () {
    // return new WeakCacheIterator(this)
    this.#iterator = new WeakCacheIterator(this)
    return this
  } */

  release() {
    if (this.#intervalRef) {
      clearInterval(this.#intervalRef)
    }
  }

  // TODO: add support for private methods and make this private
  _cleanUp() {
    for (const key of this.#cache.keys()) {
      const value = this.get(key)
      if (value === undefined) {
        this.#cache.delete(key)
      }
    }
  }
}
/*
const WeakCacheIterator = class {
  #done
  #keysIterator
  #value
  #weakCache

  constructor(weakCache) {
    this.#weakCache = weakCache
    this.#keysIterator = weakCache.keys()
    this.#done = this.#keysIterator.done
  }

  next() {
    const key = this.#keysIterator.next()
    if (key !== undefined) {
      this.#value = [ key, this.#weakCache.get(key) ]
      return this.#value
    }
  }

  get done() { return this.#keysIterator.done }

  get value() { return this.#value }
}
*/
export {
  WeakCache
}
