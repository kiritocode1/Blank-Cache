// Create discriminated union types for different cache strategies
type ExpireOption = {
	maxAge: number; // time in milliseconds - REQUIRED for Expire type
	type: "EXPIRE";
};

type NonExpireOption = {
	max: number; // max number of items in cache
	// maxAge is not allowed for these types
	type: "LRU" | "LFU" | "FIFO";
};

// Union of all possible option types
type Option = ExpireOption | NonExpireOption;

interface CacheEntry {
	expires: number | false; // @required for expire type
	content: unknown;
	index: number; // @required for LRU and LFU;
	frequency: number; // @required for LFU;
	insertedAt: number; // @required for FIFO;
}

interface CacheAPI {
	get(key: string): CacheEntry["content"] | undefined;
	set(value: unknown): string;
	remove(key: string): void;
	clear(): void;
	has(key: string): boolean;
	size(): number;
	get_state_of_cache(): Map<string, CacheEntry>;
}
/**
 * Create a cache for any kind of data. Supports LRU, LFU, FIFO, and EXPIRE strategies.
 *
 * @param {Object} option - Cache options.
 * @param {number} [option.max] - Max items for LRU, LFU, FIFO.
 * @param {number} [option.maxAge] - Max age in ms for EXPIRE cache.
 * @param {"LRU" | "LFU" | "FIFO" | "EXPIRE"} option.type - Type of cache.
 * @returns {Object} Cache API with set, get, remove, clear, has, size, get_state_of_cache.
 *
 * @example
 * const cache = Cache({ max: 3, type: "LRU" });
 * const key = cache.set("item");
 * cache.get(key); // "item"
 *
 * @example
 * const cache = Cache({ maxAge: 1000, type: "EXPIRE" });
 * const key = cache.set("item");
 * // after 1s, cache.get(key) will be undefined
 */
function Cache(option: Option = { max: 10, type: "LRU" }): CacheAPI {
	const cache = new Map<string, CacheEntry>();
	const timers = new Map<string, number>(); // Track setTimeout IDs for EXPIRE cache

	const cacheAPI = {
		/**
		 * Get an item from the cache by key.
		 * Updates recency/frequency for LRU/LFU.
		 * @param {string} key - The key from set().
		 * @returns {unknown|undefined} The cached value, or undefined if not found or expired.
		 * @example
		 * const value = cache.get(key);
		 */
		get(key: string): CacheEntry["content"] | undefined {
			const cacheEntry = cache.get(key);
			if (!cacheEntry) return undefined;

			// Check if item has expired (for EXPIRE cache)
			if (option.type === "EXPIRE" && cacheEntry.expires !== false) {
				if (Date.now() > cacheEntry.expires) {
					cache.delete(key);
					// Clear the timer if it exists
					const timerId = timers.get(key);
					if (timerId) {
						clearTimeout(timerId);
						timers.delete(key);
					}
					return undefined;
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
		 * const key = cache.set("item");
		 */
		set(value: unknown): string {
			const key = crypto.randomUUID();

			if (option.type === "LRU") {
				const lru_key = cacheAPI._get_lru_key();
				if (lru_key && cache.size >= option.max) {
					cache.delete(lru_key);
				}
				// update the index of the remaining items to the next index
				for (const [key, value] of cache) {
					cache.set(key, { ...value, index: value.index + 1 });
				}
				cache.set(key, { expires: false, content: value, index: 0, frequency: 0, insertedAt: Date.now() });
			}

			if (option.type === "LFU") {
				const lfu_key = cacheAPI._get_lfu_key();
				if (lfu_key && cache.size >= option.max) {
					cache.delete(lfu_key);
				}
				cache.set(key, { expires: false, content: value, index: 0, frequency: 0, insertedAt: Date.now() });
			}

			if (option.type === "FIFO") {
				const fifo_key = cacheAPI._get_fifo_key();
				if (fifo_key && cache.size >= option.max) {
					cache.delete(fifo_key);
				}
				cache.set(key, { expires: false, content: value, index: 0, frequency: 0, insertedAt: Date.now() });
			}

			if (option.type === "EXPIRE") {
				cache.set(key, {
					expires: Date.now() + option.maxAge,
					content: value,
					index: 0,
					frequency: 0,
					insertedAt: Date.now(),
				});

				const timerId = setTimeout(() => {
					cache.delete(key);
					timers.delete(key);
				}, option.maxAge);

				timers.set(key, timerId);
			}

			return key;
		},

		_get_lru_key(): string | undefined {
			// we do it this way because we want to get the key of the least recently used item, when we set a new item , we need to delete the least recently used item.we sort the cache based on the index, the least recently used item is the one with the highest index.
			const maxIndex = cache.size - 1;
			for (const [key, value] of cache) {
				if (value.index === maxIndex) {
					return key;
				}
			}
			return undefined;
		},

		_get_lfu_key(): string | undefined {
			// we do it this way because we want to get the key of the least frequently used item,
			//  when we set a new item , we need to delete the least frequently used item.we sort the cache based on the frequency,
			// the least frequently used item is the one with the lowest frequency.
			const minFrequency = Math.min(...Array.from(cache.values()).map((value) => value.frequency));
			for (const [key, value] of cache) {
				if (value.frequency === minFrequency) {
					return key;
				}
			}
			return undefined;
		},

		_get_fifo_key(): string | undefined {
			// we do it this way because we want to get the key of the first inserted item,
			//  when we set a new item , we need to delete the first inserted item.
			// we sort the cache based on the insertedAt, the first inserted item is the one with the lowest insertedAt.
			const minInsertedAt = Math.min(...Array.from(cache.values()).map((value) => value.insertedAt));
			for (const [key, value] of cache) {
				if (value.insertedAt === minInsertedAt) {
					return key;
				}
			}
			return undefined;
		},

		_update_lru_entries(keyUnique: string) {
			// update the lru entries so the now used entry is updated to have least index, while others move.
			console.log("updating lru entries");
			for (const [key, value] of cache) {
				if (keyUnique === key) {
					cache.set(key, { ...value, index: 0 });
				} else {
					cache.set(key, { ...value, index: value.index + 1 });
				}
			}
		},

		_update_lfu_entries(keyUnique: string) {
			for (const [key, value] of cache) {
				if (keyUnique === key) {
					cache.set(key, { ...value, frequency: value.frequency + 1 });
				}
			}
		},

		_update_fifo_entries(keyUnique: string) {
			// FIFO doesn"t need to update entries on access
			// The order is maintained by insertedAt timestamp
			for (const [key, value] of cache) {
				if (keyUnique === key) {
					cache.set(key, { ...value, insertedAt: Date.now() });
				}
			}
		},

		/**
		 * Get the current state of the cache as a Map.
		 * Useful for debugging or inspection.
		 * @returns {Map<string, CacheEntry>} Map of key to cache entry.
		 * @example
		 * const state = cache.get_state_of_cache();
		 */
		get_state_of_cache(): Map<string, CacheEntry> {
			return new Map(cache.entries());
		},

		/**
		 * Remove all items from the cache.
		 * Also clears timers for EXPIRE cache.
		 * @example
		 * cache.clear();
		 */
		clear() {
			// Clear all timers for EXPIRE cache
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
		 * cache.remove(key);
		 */
		remove(key: string) {
			// Clear timer if it exists (for EXPIRE cache)
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
		 * cache.has(key);
		 */
		has(key: string) {
			const entry = cache.get(key);
			if (!entry) return false;

			// Check if item has expired (for EXPIRE cache)
			if (option.type === "EXPIRE" && entry.expires !== false) {
				if (Date.now() > entry.expires) {
					cache.delete(key);
					// Clear the timer if it exists
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
		 * cache.size();
		 */
		size() {
			// Clean up expired items before returning size (for EXPIRE cache)
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
		},
	};
	return cacheAPI;
}

export default Cache;
