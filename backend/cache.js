// ============================================
// cache.js — In-memory TTL cache
// ============================================

const store = new Map(); // key → { data, ts, ttl }

/**
 * Get a cached value. Returns null if missing or expired.
 * @param {string} key
 * @returns {any|null}
 */
export function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Store a value with a TTL.
 * @param {string} key
 * @param {any} data
 * @param {number} ttl  milliseconds (default 1 hour)
 */
export function set(key, data, ttl = 60 * 60 * 1000) {
  store.set(key, { data, ts: Date.now(), ttl });
}

/**
 * Check if key exists and is still fresh.
 * @param {string} key
 * @returns {boolean}
 */
export function has(key) {
  return get(key) !== null;
}

/**
 * Delete a specific key.
 * @param {string} key
 */
export function del(key) {
  store.delete(key);
}

/**
 * Clear the entire cache.
 */
export function clear() {
  store.clear();
}

/**
 * Return metadata about all cached keys (for health check).
 * @returns {Record<string, { age: number, ttl: number, fresh: boolean }>}
 */
export function stats() {
  const now = Date.now();
  const result = {};
  for (const [key, entry] of store.entries()) {
    const age = now - entry.ts;
    result[key] = {
      cachedAt: new Date(entry.ts).toISOString(),
      age:      Math.round(age / 1000) + 's',
      ttl:      Math.round(entry.ttl / 1000) + 's',
      fresh:    age < entry.ttl
    };
  }
  return result;
}
