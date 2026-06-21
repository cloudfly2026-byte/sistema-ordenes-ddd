import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private cache: Map<string, { value: unknown; expiresAt: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async flush(): Promise<void> {
    this.cache.clear();
  }
}

