/**
 * @module
 *
 * # @blank/cache
 *
 * A flexible, high-performance cache library for Deno and JavaScript, supporting multiple strategies:
 *
 * - **LRU** (Least Recently Used): Evicts the least recently accessed items first.
 * - **LFU** (Least Frequently Used): Evicts the least frequently accessed items first.
 * - **FIFO** (First In First Out): Evicts the oldest items first.
 * - **EXPIRE**: Items expire after a specified time (in milliseconds).
 *
 * ## Getting Started
 *
 * Install via [JSR](https://jsr.io/@blank/cache) (recommended):
 *
 * ```ts
 * import Cache from "jsr:@blank/cache";
 * ```
 *
 * ## Usage Examples
 *
 * ### LRU
 * ```ts
 * const cache = Cache({ max: 3, type: "LRU" });
 * const key = cache.set("item");
 * cache.get(key); // "item"
 * ```
 *
 * ### EXPIRE
 * ```ts
 * const cache = Cache({ maxAge: 1000, type: "EXPIRE" });
 * const key = cache.set("item");
 * // After 1s, cache.get(key) will be undefined
 * setTimeout(() => {
 *   cache.get(key); // undefined
 * }, 2000);
 * ```
 *
 * ### LFU
 * ```ts
 * const cache = Cache({ max: 3, type: "LFU" });
 * const key = cache.set("item");
 * cache.get(key); // "item"
 * ```
 *
 * ### FIFO
 * ```ts
 * const cache = Cache({ max: 3, type: "FIFO" });
 * const key = cache.set("item");
 * cache.get(key); // "item"
 * ```
 *
 * ## API Overview
 *
 * - `set(value: unknown): string` — Add a value, returns a unique key (UUID).
 * - `get(key: string): unknown | undefined` — Get a value by key.
 * - `remove(key: string): void` — Remove a value by key.
 * - `clear(): void` — Remove all items.
 * - `has(key: string): boolean` — Check if a key exists and is not expired.
 * - `size(): number` — Number of items in the cache.
 * - `get_state_of_cache(): Map<string, CacheEntry>` — Inspect the cache state.
 *
 * For full documentation and advanced usage, see the [README](https://github.com/kiritocode1/Blank-Cache#readme).
 *
 * ---
 *
 * **Author:** [BLANK](https://github.com/kiritocode1)
 *
 * Love from the future.
 */
import Cache from "./lib/cache.ts";

export default Cache;
// love from the future , Blank [ https://github.com/kiritocode1]
