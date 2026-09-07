import Redis from 'ioredis';
import { env } from './env';

/**
 * Redis wrapper with an in-memory fallback so the app still runs
 * even when REDIS_URL is not configured.
 */

type CacheValue = string | number | boolean | object | null;

class MemoryStore {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async set(key: string, value: string, ttlSeconds?: number) {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const k of keys) if (this.store.delete(k)) n++;
    return n;
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }

  get isRedis() {
    return false;
  }
}

class RedisClient {
  private client: Redis | null = null;
  private mem = new MemoryStore();

  constructor(url?: string) {
    if (url) {
      try {
        this.client = new Redis(url, {
          lazyConnect: true,
          maxRetriesPerRequest: 2,
        });
        this.client.on('error', (err) => {
          console.warn('⚠️  Redis unavailable, falling back to in-memory store:', err.message);
          this.client = null;
        });
      } catch {
        this.client = null;
      }
    }
    if (!this.client && url) {
      console.warn('⚠️  Redis not reachable — using in-memory fallback. Cache resets on restart.');
    }
  }

  get isRedis() {
    return !!this.client;
  }

  private async withClient<T>(fn: (r: Redis) => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.client) {
      try {
        return await fn(this.client);
      } catch {
        return fallback();
      }
    }
    return fallback();
  }

  async set(key: string, value: CacheValue, ttlSeconds?: number) {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    await this.withClient(
      (r) => (ttlSeconds ? r.set(key, payload, 'EX', ttlSeconds) : r.set(key, payload)) as Promise<unknown>,
      () => this.mem.set(key, payload, ttlSeconds)
    );
  }

  async get<T = string>(key: string): Promise<T | null> {
    const raw = await this.withClient<string | null>(
      (r) => r.get(key) as Promise<string | null>,
      () => this.mem.get(key)
    );
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async del(...keys: string[]) {
    await this.withClient((r) => r.del(...keys) as Promise<unknown>, () => this.mem.del(...keys));
  }

  async exists(key: string): Promise<boolean> {
    const n = await this.withClient((r) => r.exists(key), () => this.mem.exists(key));
    return n > 0;
  }

  async incr(key: string): Promise<number> {
    return this.withClient<number>((r) => r.incr(key), async () => {
      const cur = await this.mem.get(key);
      const next = (cur ? parseInt(cur, 10) : 0) + 1;
      await this.mem.set(key, String(next), undefined);
      return next;
    });
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.withClient(
      (r) => r.expire(key, seconds) as Promise<unknown>,
      async () => {
        const entry = await this.mem.get(key);
        if (entry !== null) await this.mem.set(key, entry, seconds);
      }
    );
  }
}

export const redis = new RedisClient(env.REDIS_URL);