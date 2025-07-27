import { assertEquals, assertNotEquals } from "@std/assert";
import Cache from "./lib/cache.ts";

Deno.test("LRU Cache - Basic functionality", () => {
	const cache = Cache({ max: 3, type: "LRU" });

	// Test setting and getting items
	const key1 = cache.set("item1");
	const key2 = cache.set("item2");
	const key3 = cache.set("item3");

	assertEquals(cache.get(key1), "item1");
	assertEquals(cache.get(key2), "item2");
	assertEquals(cache.get(key3), "item3");
});

Deno.test("LRU Cache - Eviction behavior", () => {
	const cache = Cache({ max: 3, type: "LRU" });

	const key1 = cache.set("item1");
	const key2 = cache.set("item2");
	const key3 = cache.set("item3");

	// All items should be present
	assertEquals(cache.get_state_of_cache().size, 3);

	// Add fourth item - should evict least recently used (item1)
	const key4 = cache.set("item4");

	assertEquals(cache.get_state_of_cache().size, 3);
	assertEquals(cache.get(key1), undefined); // item1 should be evicted
	assertEquals(cache.get(key2), "item2");
	assertEquals(cache.get(key3), "item3");
	assertEquals(cache.get(key4), "item4");
});

Deno.test("LRU Cache - Access updates recency", () => {
	const cache = Cache({ max: 3, type: "LRU" });

	const key1 = cache.set("item1");
	const key2 = cache.set("item2");
	const key3 = cache.set("item3");

	// Access item1 to make it most recently used
	cache.get(key1);

	// Add fourth item - should evict item2 (least recently used)
	const key4 = cache.set("item4");

	assertEquals(cache.get(key1), "item1"); // Should still exist
	assertEquals(cache.get(key2), undefined); // Should be evicted
	assertEquals(cache.get(key3), "item3");
	assertEquals(cache.get(key4), "item4");
});

Deno.test("LRU Cache - Index tracking", () => {
	const cache = Cache({ max: 3, type: "LRU" });

	const key1 = cache.set("item1");
	const key2 = cache.set("item2");
	const key3 = cache.set("item3");

	// Initial state: item3 should have index 0 (most recent)
	const initialState = cache.get_state_of_cache();
	const item3Entry = Array.from(initialState.values()).find((v) => v.content === "item3");
	assertEquals(item3Entry?.index, 0);

	// Access item1 - it should become index 0
	cache.get(key1);
	const afterAccessState = cache.get_state_of_cache();
	const item1Entry = Array.from(afterAccessState.values()).find((v) => v.content === "item1");
	assertEquals(item1Entry?.index, 0);
});

Deno.test("LFU Cache - Basic functionality", () => {
	const cache = Cache({ max: 3, type: "LFU" });

	const key1 = cache.set("item1");
	const key2 = cache.set("item2");
	const key3 = cache.set("item3");

	assertEquals(cache.get(key1), "item1");
	assertEquals(cache.get(key2), "item2");
	assertEquals(cache.get(key3), "item3");
});

Deno.test("LFU Cache - Frequency tracking", () => {
	const cache = Cache({ max: 3, type: "LFU" });

	const key1 = cache.set("item1");
	const key2 = cache.set("item2");

	// Initial frequency should be 0
	let state = cache.get_state_of_cache();
	let item1Entry = Array.from(state.values()).find((v) => v.content === "item1");
	assertEquals(item1Entry?.frequency, 0);

	// Access item1 multiple times
	cache.get(key1);
	cache.get(key1);
	cache.get(key1);

	state = cache.get_state_of_cache();
	item1Entry = Array.from(state.values()).find((v) => v.content === "item1");
	assertEquals(item1Entry?.frequency, 3);
});

Deno.test("LFU Cache - Eviction behavior", () => {
	const cache = Cache({ max: 3, type: "LFU" });

	const key1 = cache.set("item1");
	const key2 = cache.set("item2");
	const key3 = cache.set("item3");

	// Access item1 and item3 to increase their frequency
	cache.get(key1); // item1 frequency: 1
	cache.get(key1); // item1 frequency: 2
	cache.get(key3); // item3 frequency: 1
	// item2 remains at frequency: 0

	// Add fourth item - should evict item2 (lowest frequency)
	const key4 = cache.set("item4");

	assertEquals(cache.get_state_of_cache().size, 3);
	assertEquals(cache.get(key1), "item1"); // Should exist (high frequency)
	assertEquals(cache.get(key2), undefined); // Should be evicted (low frequency)
	assertEquals(cache.get(key3), "item3"); // Should exist (medium frequency)
	assertEquals(cache.get(key4), "item4"); // Should exist (new item)
});

Deno.test("LFU Cache - Tie breaking with equal frequencies", () => {
	const cache = Cache({ max: 2, type: "LFU" });

	const key1 = cache.set("item1");
	const key2 = cache.set("item2");

	// Both items have frequency 0, add third item
	const key3 = cache.set("item3");

	assertEquals(cache.get_state_of_cache().size, 2);
	// One of the first two items should be evicted
	const remainingItems = Array.from(cache.get_state_of_cache().values()).map((v) => v.content);
	assertEquals(remainingItems.length, 2);
	assertEquals(remainingItems.includes("item3"), true);
});

Deno.test("FIFO Cache - Basic functionality", () => {
	const cache = Cache({ max: 3, type: "FIFO" });

	const key1 = cache.set("item1");
	const key2 = cache.set("item2");
	const key3 = cache.set("item3");

	assertEquals(cache.get(key1), "item1");
	assertEquals(cache.get(key2), "item2");
	assertEquals(cache.get(key3), "item3");
});

Deno.test("FIFO Cache - Eviction behavior", () => {
	const cache = Cache({ max: 3, type: "FIFO" });

	const key1 = cache.set("item1");
	const key2 = cache.set("item2");
	const key3 = cache.set("item3");

	// Access items (shouldn&apos;t affect FIFO order)
	cache.get(key1);
	cache.get(key2);
	cache.get(key3);

	// Add fourth item - should evict first inserted (item1)
	const key4 = cache.set("item4");

	assertEquals(cache.get_state_of_cache().size, 3);
	assertEquals(cache.get(key1), undefined); // Should be evicted (first in)
	assertEquals(cache.get(key2), "item2");
	assertEquals(cache.get(key3), "item3");
	assertEquals(cache.get(key4), "item4");
});

Deno.test("Cache - UUID key generation", () => {
	const cache = Cache({ max: 10, type: "LRU" });

	const key1 = cache.set("item1");
	const key2 = cache.set("item2");

	// Keys should be different UUIDs
	assertNotEquals(key1, key2);
	assertEquals(typeof key1, "string");
	assertEquals(typeof key2, "string");

	// UUID format check (basic)
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	assertEquals(uuidRegex.test(key1), true);
	assertEquals(uuidRegex.test(key2), true);
});
