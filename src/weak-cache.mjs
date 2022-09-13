const WeakCache = class {
  #cache
  #globalFinalizationCallback
  #intervalRef
  #size
  
  #iterator
  
  constructor({ globalFinalizationCallback, cleanupInterval = 60 * 1000 } = {}) {
    this.#cache = new Map()
    this.#globalFinalizationCallback = globalFinalizationCallback
    
    this.#intervalRef = setInterval(() => this._cleanUp(), cleanupInterval)
    
    this.#size = 0
  }
  
  put(key, value, { finalizationCallback } = {}) {
    if (key === undefined) {
      throw new Error("WeakCache does not support 'undefined' keys.")
    }
    
    const addOne = this.has(key) === false
    
    try {
      const valueType = typeof value
      if (valueType === 'object' || valueType === 'function') {
        if (finalizationCallback !== undefined || this.#globalFinalizationCallback !== undefined) {
          const globalFinalizationCallback = this.#globalFinalizationCallback
          const fc = finalizationCallback !== undefined && this.#globalFinalizationCallback !== undefined
            ? (value) => { globalFinalizationCallback(value); finalizationCallback(value); }
            : finalizationCallback
              ? finalizationCallback
              : globalFinalizationCallback
          
          const fr = new FinalizationRegistry(fc)
          fr.register(value)
        }
        
        this.#cache.set(key, { isRef: true, value: new WeakRef(value) })
      }
      else {
        this.#cache.set(key, { isRef: false, value: value })
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
    
    return valueSpec.isRef
      ? valueSpec.value.deref()
      : valueSpec.value
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
    
  /*
  [Symbol.iterator] () {
    // return new WeakCacheIterator(this)
    this.#iterator = new WeakCacheIterator(this)
    return this
  }*/
  
  release() {
    clearInterval(this.#intervalRef)
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
