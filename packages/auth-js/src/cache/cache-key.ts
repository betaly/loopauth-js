import {CacheEntry} from './types';

export const CACHE_KEY_PREFIX = '@@loopauth@@';
export const CACHE_KEY_ID_TOKEN_SUFFIX = '@@user@@';

export type CacheKeyData = {
  clientId: string;
  audience?: string;
};

export class CacheKey {
  public clientId: string;
  public audience?: string;

  constructor(data: CacheKeyData, public prefix: string = CACHE_KEY_PREFIX, public suffix?: string) {
    this.clientId = data.clientId;
    this.audience = data.audience;
  }

  /**
   * Converts a cache key string into a `CacheKey` instance.
   * @param key The key to convert
   * @returns An instance of `CacheKey`
   */
  static fromKey(key: string): CacheKey {
    const [prefix, clientId, audience] = key.split('::');

    return new CacheKey({clientId, audience}, prefix);
  }

  /**
   * Utility function to build a `CacheKey` instance from a cache entry
   * @param entry The entry
   * @returns An instance of `CacheKey`
   */
  static fromCacheEntry(entry: CacheEntry): CacheKey {
    const {clientId, audience} = entry;

    return new CacheKey({
      clientId,
      audience,
    });
  }

  /**
   * Converts this `CacheKey` instance into a string for use in a cache
   * @returns A string representation of the key
   */
  toKey(): string {
    return [this.prefix, this.clientId, this.audience, this.suffix].filter(Boolean).join('::');
  }
}
