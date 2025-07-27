
import Cache from "./lib/cache.ts"



const cache = Cache({ type: "LRU", max: 10 });

const key1 = cache.set("item1");
const key2 = cache.set("item2");
const key3 = cache.set("item3");
cache.get(key1);
const key4 = cache.set("item4");
const key5 = cache.set("item5");
const key6 = cache.set("item6");
const key7 = cache.set("item7");
const key8 = cache.set("item8");
const key9 = cache.set("item9");
const key10 = cache.set("item10");

console.log(cache.get_state_of_cache());



