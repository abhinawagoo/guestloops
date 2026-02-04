/**
 * In-memory TTL cache for tenant resolution (slug → tenant, id → tenant).
 * Reduces DB load when many concurrent requests hit the same tenant.
 * Works in Node.js (API routes, Server Components); in Edge middleware
 * the cache is per-isolate so benefits are best in serverless Node.
 *
 * Best practice: keep TTL short (60–120s) so new/updated tenants appear quickly.
 */

const TTL_MS = 90 * 1000; // 90 seconds
const MAX_ENTRIES = 1000;

type Entry<T> = { value: T; expiresAt: number };

class TenantCache {
  private slugCache = new Map<string, Entry<unknown>>();
  private idCache = new Map<string, Entry<unknown>>();
  private slugKeys: string[] = [];
  private idKeys: string[] = [];

  private evictExpired(map: Map<string, Entry<unknown>>, keys: string[]): void {
    const now = Date.now();
    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i];
      const entry = map.get(key) as Entry<unknown> | undefined;
      if (!entry || entry.expiresAt <= now) {
        map.delete(key);
        keys.splice(i, 1);
      }
    }
  }

  private evictOldest(map: Map<string, Entry<unknown>>, keys: string[]): void {
    if (keys.length === 0) return;
    const key = keys.shift()!;
    map.delete(key);
  }

  getBySlug<T>(slug: string): T | null {
    this.evictExpired(this.slugCache, this.slugKeys);
    const entry = this.slugCache.get(slug) as Entry<T> | undefined;
    if (!entry || entry.expiresAt <= Date.now()) return null;
    return entry.value;
  }

  setBySlug<T>(slug: string, value: T): void {
    this.evictExpired(this.slugCache, this.slugKeys);
    if (this.slugCache.size >= MAX_ENTRIES) this.evictOldest(this.slugCache, this.slugKeys);
    const expiresAt = Date.now() + TTL_MS;
    this.slugCache.set(slug, { value, expiresAt });
    this.slugKeys.push(slug);
  }

  getById<T>(id: string): T | null {
    this.evictExpired(this.idCache, this.idKeys);
    const entry = this.idCache.get(id) as Entry<T> | undefined;
    if (!entry || entry.expiresAt <= Date.now()) return null;
    return entry.value;
  }

  setById<T>(id: string, value: T): void {
    this.evictExpired(this.idCache, this.idKeys);
    if (this.idCache.size >= MAX_ENTRIES) this.evictOldest(this.idCache, this.idKeys);
    const expiresAt = Date.now() + TTL_MS;
    this.idCache.set(id, { value, expiresAt });
    this.idKeys.push(id);
  }

  invalidateSlug(slug: string): void {
    this.slugCache.delete(slug);
    const i = this.slugKeys.indexOf(slug);
    if (i >= 0) this.slugKeys.splice(i, 1);
  }

  invalidateId(id: string): void {
    this.idCache.delete(id);
    const i = this.idKeys.indexOf(id);
    if (i >= 0) this.idKeys.splice(i, 1);
  }
}

export const tenantCache = new TenantCache();
