import {ClientStorage, ClientStorageOptions} from '@loopauth/client';

import {CookieCache} from './cookie-cache';

export class CookieStorage implements ClientStorage {
  constructor(protected readonly cache: CookieCache) {}

  async get<T extends object>(key: string): Promise<T | undefined> {
    return this.cache.get(key);
  }

  async remove(key: string, options?: ClientStorageOptions): Promise<void> {
    return this.cache.remove(key);
  }

  async set(key: string, value: any, options?: ClientStorageOptions): Promise<void> {
    return this.cache.set(key, value);
  }

  async clear(): Promise<void> {
    return this.cache.clear();
  }

  async save(): Promise<void> {
    return this.cache.save();
  }
}
