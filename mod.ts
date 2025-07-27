/**
 * A flexible cache library for Deno and JavaScript supporting LRU, LFU, FIFO, and EXPIRE strategies.
 *
 * Features:
 * - LRU (Least Recently Used)
 * - LFU (Least Frequently Used)
 * - FIFO (First In First Out)
 * - EXPIRE (Time-based expiration)
 * - TypeScript support
 *
 * @example
 * ```ts
 * import Cache from "jsr:@blank/cache";
 * const cache = Cache({ max: 3, type: "LRU" });
 * const key = cache.set("item");
 * cache.get(key); // "item"
 * ```
 * 
 * ```ts 
 * import Cache from "jsr:@blank/cache";
 * const cache = Cache({ maxAge: 1000, type: "EXPIRE" });
 * const key = cache.set("item");
 * // after 1s, cache.get(key) will be undefined
 * setTimeout(() => {
 *     cache.get(key); // undefined
 * }, 2 000);
 * ```
 *
 * ```ts
 * import Cache from "jsr:@blank/cache";
 * const cache = Cache({ max: 3, type: "LFU" });
 * const key = cache.set("item");
 * cache.get(key); // "item"
 * ```
 *
 * ```ts
 * import Cache from "jsr:@blank/cache";
 * const cache = Cache({ max: 3, type: "FIFO" });
 * const key = cache.set("item");
 * cache.get(key); // "item"
 * ```
 *
 * 
 * @module
 */
import Cache from "./lib/cache.ts";

export default Cache;
// love from the future , Blank [ https://github.com/kiritocode1]
