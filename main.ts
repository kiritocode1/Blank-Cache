import Cache from "./lib/cache.ts";

const cache = Cache({ max: 5, type: "LFU" });

console.log("=== Setting initial items ===");
const id1 = cache.set("item1");
const id2 = cache.set("item2");
const id3 = cache.set("item3");
const id4 = cache.set("item4");
const id5 = cache.set("item5");

console.log("Initial cache:");
for (const [key, value] of cache.get_state_of_cache()) {
	console.log(`  Content: ${value.content}, Frequency: ${value.frequency}`);
}

console.log("\n=== Accessing items to increase frequency ===");
cache.get(id1); // item1 frequency: 0 -> 1
cache.get(id1); // item1 frequency: 1 -> 2
cache.get(id3); // item3 frequency: 0 -> 1

console.log("After accessing item1 twice and item3 once:");
for (const [key, value] of cache.get_state_of_cache()) {
	console.log(`  Content: ${value.content}, Frequency: ${value.frequency}`);
}

console.log("\n=== Adding new item (should evict least frequent) ===");
cache.set("item6"); // Should evict item2, item4, or item5 (all have frequency 0)

console.log("Final cache after adding item6:");
const finalContents = Array.from(cache.get_state_of_cache().values()).map((v) => v.content);
console.log(`Contents: [${finalContents.join(", ")}]`);

for (const [key, value] of cache.get_state_of_cache()) {
	console.log(`  Content: ${value.content}, Frequency: ${value.frequency}`);
}
