const cache = new Map();
const DEFAULT_TTL = 300; // 5 minutes

function set(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl * 1000
  });
}

function get(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function del(key) {
  cache.delete(key);
}

function clear() {
  cache.clear();
}

module.exports = { set, get, del, clear };