/**
 * Configuration for EXPIRE cache type
 */
export type ExpireOption = {
	/** Time in milliseconds after which items expire */
	maxAge: number;
	type: "EXPIRE";
};

/**
 * Configuration for non-expiring cache types (LRU, LFU, FIFO)
 */
export type NonExpireOption = {
	/** Maximum number of items in cache */
	max: number;
	type: "LRU" | "LFU" | "FIFO";
};

/**
 * Union of all possible cache configuration options
 */
export type Option = ExpireOption | NonExpireOption;

/**
 * Internal cache entry structure
 */
export interface CacheEntry {
	/** Expiration timestamp or false for non-expiring entries */
	expires: number | false;
	/** The cached content */
	content: unknown;
	/** Index for LRU ordering */
	index: number;
	/** Access frequency for LFU */
	frequency: number;
	/** Insertion timestamp for FIFO */
	insertedAt: number;
}

/**
 * Cache API interface
 */
export interface CacheAPI {
	/**
	 * Get an item from the cache by key.
	 * Updates recency/frequency for LRU/LFU.
	 * @param key - The key from set()
	 * @returns The cached value, or undefined if not found or expired
	 */
	get(key: string): unknown | undefined;

	/**
	 * Add a value to the cache. Returns a unique key (UUID).
	 * May evict an item if cache is full.
	 * @param value - The value to store
	 * @returns The key for the value
	 */
	set(value: unknown): string;

	/**
	 * Remove a specific item from the cache by key.
	 * @param key - The key to remove
	 */
	remove(key: string): void;

	/**
	 * Remove all items from the cache.
	 * Also clears timers for EXPIRE cache.
	 */
	clear(): void;

	/**
	 * Check if a key exists in the cache and is not expired.
	 * @param key - The key to check
	 * @returns True if present and not expired
	 */
	has(key: string): boolean;

	/**
	 * Get the number of items in the cache.
	 * Expired items are cleaned up first for EXPIRE cache.
	 * @returns Number of items in the cache
	 */
	size(): number;

	/**
	 * Get the current state of the cache as a Map.
	 * Useful for debugging or inspection.
	 * @returns Map of key to cache entry
	 */
	get_state_of_cache(): Map<string, CacheEntry>;

	/** @internal Get the key of the least recently used item */
	_get_lru_key(): string | undefined;

	/** @internal Get the key of the least frequently used item */
	_get_lfu_key(): string | undefined;

	/** @internal Get the key of the first inserted item (FIFO) */
	_get_fifo_key(): string | undefined;

	/** @internal Update LRU entries when an item is accessed */
	_update_lru_entries(keyUnique: string): void;
}

/**
 * Create a cache for any kind of data. Supports LRU, LFU, FIFO, and EXPIRE strategies.
 *
 * @param option - Cache configuration options
 * @returns Cache API with set, get, remove, clear, has, size, get_state_of_cache methods
 *
 * @example
 * ```ts
 * // LRU Cache
 * const cache = Cache({ max: 3, type: "LRU" });
 * const key = cache.set("item");
 * cache.get(key); // "item"
 * ```
 *
 * @example
 * ```ts
 * // EXPIRE Cache
 * const cache = Cache({ maxAge: 1000, type: "EXPIRE" });
 * const key = cache.set("item");
 * // after 1s, cache.get(key) will be undefined
 * ```
 */
declare function Cache(option?: Option): CacheAPI;

export default Cache;
