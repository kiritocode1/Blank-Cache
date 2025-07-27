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

/**
 *
 * 
 *
 * the entry point of the cache library , designed to work with any type of data.
 * some examples of how to use the cache library below: 
 * ```ts 
 * const cache = Cache({ max: 10, type: "LRU" });
 * ```
 *  max is the max number of items in the cache , type is the type of the cache , LRU is the least recently used cache , LFU is the least frequently used cache , FIFO is the first in first out cache. 
 * ```ts
 * const key1 = cache.set("item1");// key1 is a random uuid
 * const key2 = cache.set("item2");// key2 is a random uuid
 * const key3 = cache.set("item3");// key3 is a random uuid
 * 
 * cache.get(key1);// returns "item1" , cache update = [item1, item2, item3]
 * cache.get(key2);// returns "item2" , cache update = [item2, item3, item1]
 * cache.get(key3);// returns "item3" , cache update = [item3, item1, item2]
 * 
 * cache.get_state_of_cache();// returns a map of the cache , the key is the uuid and the value is the item
 * 
 * cache.set("item4");// returns a random uuid , cache update = [item4, item1, item2] , if the cache is full , the least recently used item is evicted
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */
function Cache(option: Option = { max: 10, type: "LRU" }) {
	const cache = new Map<string, CacheEntry>();
	const cacheAPI = {
		get(key: string): CacheEntry["content"] | undefined {
			const cacheEntry = cache.get(key);
			if (!cacheEntry) return undefined;

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
            if(option.type === "EXPIRE"){
                cache.set(key, {
                    expires: Date.now() + option.maxAge, content: value, index: 0, frequency: 0, insertedAt:
                        Date.now()
                });

                setTimeout(() => {
                    cache.delete(key);
                }, option.maxAge);
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
			// FIFO doesn&apos;t need to update entries on access
			// The order is maintained by insertedAt timestamp
		},

		get_state_of_cache(): Map<string, CacheEntry> {
			return new Map(cache.entries());
		},

		clear() {
			cache.clear();
		},

		remove(key: string) {
			cache.delete(key);
		},

		has(key: string) {
			return cache.has(key);
		},
		size() {
			return cache.size;
        },
	};
	return cacheAPI;
}

export default Cache;
