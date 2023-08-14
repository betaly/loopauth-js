import {ICache} from './types';

export class InMemoryCache implements ICache {
  private cache: Record<string, unknown> = {};

  public set<T = unknown>(key: string, entry: T): void {
    this.cache[key] = entry;
  }

  public get<T = unknown>(key: string): T | undefined {
    const cacheEntry = this.cache[key] as T;

    if (!cacheEntry) {
      return;
    }

    return cacheEntry;
  }

  public remove(key: string): void {
    delete this.cache[key];
  }

  public allKeys(): string[] {
    return Object.keys(this.cache);
  }
}
