// lib/cache.ts
function Cache(option = {
  max: 10,
  type: "LRU"
}) {
  const cache = /* @__PURE__ */ new Map();
  const timers = /* @__PURE__ */ new Map();
  const cacheAPI = {
    /**
    * Get an item from the cache by key.
    * Updates recency/frequency for LRU/LFU.
    * @param {string} key - The key from set().
    * @returns {unknown|undefined} The cached value, or undefined if not found or expired.
    * @example
    * ```ts
    * const value = cache.get(key);
    * ```
    */
    get(key) {
      const cacheEntry = cache.get(key);
      if (!cacheEntry) return void 0;
      if (option.type === "EXPIRE" && cacheEntry.expires !== false) {
        if (Date.now() > cacheEntry.expires) {
          cache.delete(key);
          const timerId = timers.get(key);
          if (timerId) {
            clearTimeout(timerId);
            timers.delete(key);
          }
          return void 0;
        }
      }
      if (option.type === "LRU") {
        cacheAPI._update_lru_entries(key);
      }
      if (option.type === "LFU") {
        cacheAPI._update_lfu_entries(key);
      }
      if (option.type === "FIFO") {
        cacheAPI._update_fifo_entries(key);
      }
      return cacheEntry.content;
    },
    /**
    * Add a value to the cache. Returns a unique key (UUID).
    * May evict an item if cache is full.
    * @param {unknown} value - The value to store.
    * @returns {string} The key for the value.
    * @example
    * ```ts
    * const key = cache.set("item");
    * ```
    */
    set(value) {
      const key = crypto.randomUUID();
      if (option.type === "LRU") {
        const lru_key = cacheAPI._get_lru_key();
        if (lru_key && cache.size >= option.max) {
          cache.delete(lru_key);
        }
        for (const [key2, value2] of cache) {
          cache.set(key2, {
            ...value2,
            index: value2.index + 1
          });
        }
        cache.set(key, {
          expires: false,
          content: value,
          index: 0,
          frequency: 0,
          insertedAt: Date.now()
        });
      }
      if (option.type === "LFU") {
        const lfu_key = cacheAPI._get_lfu_key();
        if (lfu_key && cache.size >= option.max) {
          cache.delete(lfu_key);
        }
        cache.set(key, {
          expires: false,
          content: value,
          index: 0,
          frequency: 0,
          insertedAt: Date.now()
        });
      }
      if (option.type === "FIFO") {
        const fifo_key = cacheAPI._get_fifo_key();
        if (fifo_key && cache.size >= option.max) {
          cache.delete(fifo_key);
        }
        cache.set(key, {
          expires: false,
          content: value,
          index: 0,
          frequency: 0,
          insertedAt: Date.now()
        });
      }
      if (option.type === "EXPIRE") {
        cache.set(key, {
          expires: Date.now() + option.maxAge,
          content: value,
          index: 0,
          frequency: 0,
          insertedAt: Date.now()
        });
        const timerId = setTimeout(() => {
          cache.delete(key);
          timers.delete(key);
        }, option.maxAge);
        timers.set(key, timerId);
      }
      return key;
    },
    _get_lru_key() {
      const maxIndex = cache.size - 1;
      for (const [key, value] of cache) {
        if (value.index === maxIndex) {
          return key;
        }
      }
      return void 0;
    },
    _get_lfu_key() {
      const minFrequency = Math.min(...Array.from(cache.values()).map((value) => value.frequency));
      for (const [key, value] of cache) {
        if (value.frequency === minFrequency) {
          return key;
        }
      }
      return void 0;
    },
    _get_fifo_key() {
      const minInsertedAt = Math.min(...Array.from(cache.values()).map((value) => value.insertedAt));
      for (const [key, value] of cache) {
        if (value.insertedAt === minInsertedAt) {
          return key;
        }
      }
      return void 0;
    },
    _update_lru_entries(keyUnique) {
      console.log("updating lru entries");
      for (const [key, value] of cache) {
        if (keyUnique === key) {
          cache.set(key, {
            ...value,
            index: 0
          });
        } else {
          cache.set(key, {
            ...value,
            index: value.index + 1
          });
        }
      }
    },
    _update_lfu_entries(keyUnique) {
      for (const [key, value] of cache) {
        if (keyUnique === key) {
          cache.set(key, {
            ...value,
            frequency: value.frequency + 1
          });
        }
      }
    },
    _update_fifo_entries(keyUnique) {
      for (const [key, value] of cache) {
        if (keyUnique === key) {
          cache.set(key, {
            ...value,
            insertedAt: Date.now()
          });
        }
      }
    },
    /**
    * Get the current state of the cache as a Map.
    * Useful for debugging or inspection.
    * @returns {Map<string, CacheEntry>} Map of key to cache entry.
    * @example
    * ```ts
    * const state = cache.get_state_of_cache();
    * ```
    */
    get_state_of_cache() {
      return new Map(cache);
    },
    /**
    * Remove all items from the cache.
    * Also clears timers for EXPIRE cache.
    * @example
    * ```ts
    * cache.clear();
    * ```
    */
    clear() {
      if (option.type === "EXPIRE") {
        for (const timerId of timers.values()) {
          clearTimeout(timerId);
        }
        timers.clear();
      }
      cache.clear();
    },
    /**
    * Remove a specific item from the cache by key.
    * @param {string} key - The key to remove.
    * @example
    * ```ts
    * cache.remove(key);
    * ```
    */
    remove(key) {
      if (option.type === "EXPIRE") {
        const timerId = timers.get(key);
        if (timerId) {
          clearTimeout(timerId);
          timers.delete(key);
        }
      }
      cache.delete(key);
    },
    /**
    * Check if a key exists in the cache and is not expired.
    * @param {string} key - The key to check.
    * @returns {boolean} True if present and not expired.
    * @example
    * ```ts
    * cache.has(key);
    * ```
    */
    has(key) {
      const entry = cache.get(key);
      if (!entry) return false;
      if (option.type === "EXPIRE" && entry.expires !== false) {
        if (Date.now() > entry.expires) {
          cache.delete(key);
          const timerId = timers.get(key);
          if (timerId) {
            clearTimeout(timerId);
            timers.delete(key);
          }
          return false;
        }
      }
      return true;
    },
    /**
    * Get the number of items in the cache (expired items are cleaned up first for EXPIRE).
    * @returns {number} Number of items in the cache.
    * @example
    * ```ts
    * cache.size();
    * ```
    */
    size() {
      if (option.type === "EXPIRE") {
        const now = Date.now();
        for (const [key, entry] of cache.entries()) {
          if (entry.expires !== false && now > entry.expires) {
            cache.delete(key);
            const timerId = timers.get(key);
            if (timerId) {
              clearTimeout(timerId);
              timers.delete(key);
            }
          }
        }
      }
      return cache.size;
    }
  };
  return cacheAPI;
}
var cache_default = Cache;

// mod.ts
var mod_default = cache_default;
export {
  mod_default as default
};
