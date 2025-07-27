
import Cache from "./lib/cache.ts"


const cache = Cache({ type: "EXPIRE", maxAge: 1000 });


const key1 = cache.set("item1");

console.log(cache.get(key1));

setTimeout(() => {
    console.log(cache.get(key1));
}, 3000);