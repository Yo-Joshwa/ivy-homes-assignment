const x = require("./data/investigation/listings.json");

const m = new Map();

for (const a of x) {
  const key = [a.latitude, a.longitude].join("|");

  if (!m.has(key)) {
    m.set(key, []);
  }

  m.get(key).push(a.listing_id);
}

const repeated = [...m.entries()]
  .filter(([key, ids]) => key !== "undefined|undefined" && ids.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log("Repeated coordinate groups:", repeated.length);
console.log(repeated.slice(0, 20));
