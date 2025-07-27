# @blank/cache

A simple, fast, and flexible cache library for Deno and JavaScript, supporting LRU, LFU, FIFO, and EXPIRE strategies. Works great with TypeScript and is published on [jsr.io](https://jsr.io/@blank/cache).

## Features

-   LRU (Least Recently Used) cache
-   LFU (Least Frequently Used) cache
-   FIFO (First In First Out) cache
-   EXPIRE (Time-based expiration) cache
-   TypeScript support with exported types
-   Simple API

## Install

**With JSR (recommended):**

```ts
import Cache from "jsr:@blank/cache";
```

**With URL:**

```ts
import Cache from "https://deno.land/x/cache@<version>/mod.ts";
```

## Usage

### LRU Example

```ts
import Cache from "jsr:@blank/cache";
const cache = Cache({ max: 3, type: "LRU" });
const key = cache.set("item");
console.log(cache.get(key)); // "item"
```

### EXPIRE Example

```ts
import Cache from "jsr:@blank/cache";
const cache = Cache({ maxAge: 1000, type: "EXPIRE" });
const key = cache.set("item");
setTimeout(() => {
	console.log(cache.get(key)); // undefined (after 1s)
}, 1100);
```

## API

### `Cache(options)`

Creates a new cache instance.

-   `options.max` (number): Max items for LRU, LFU, FIFO.
-   `options.maxAge` (number): Max age in ms for EXPIRE cache.
-   `options.type` ("LRU" | "LFU" | "FIFO" | "EXPIRE"): Type of cache.

#### Methods

-   `set(value: unknown): string` — Add a value, returns a unique key (UUID).
-   `get(key: string): unknown | undefined` — Get a value by key.
-   `remove(key: string): void` — Remove a value by key.
-   `clear(): void` — Remove all items.
-   `has(key: string): boolean` — Check if a key exists and is not expired.
-   `size(): number` — Number of items in the cache.
-   `get_state_of_cache(): Map<string, CacheEntry>` — Inspect the cache state.

### TypeScript Support

All public types are exported:

```ts
import type { Option, CacheEntry } from "jsr:@blank/cache";
```

## Run Tests

```sh
deno test
```

## License

MIT

## Links

-   [JSR Package](https://jsr.io/@blank/cache)
-   [GitHub](https://github.com/kiritocode1/Blank-Cache)
