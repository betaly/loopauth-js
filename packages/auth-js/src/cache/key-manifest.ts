import {CACHE_KEY_PREFIX} from './cache-key';
import {ICache, KeyManifestEntry, MaybePromise} from './types';

export class CacheKeyManifest {
  private readonly manifestKey: string;

  constructor(private cache: ICache, private clientId: string) {
    this.manifestKey = this.createManifestKeyFrom(this.clientId);
  }

  async add(key: string): Promise<void> {
    const keys = new Set((await this.cache.get<KeyManifestEntry>(this.manifestKey))?.keys || []);

    keys.add(key);

    await this.cache.set<KeyManifestEntry>(this.manifestKey, {
      keys: [...keys],
    });
  }

  async remove(key: string): Promise<void> {
    const entry = await this.cache.get<KeyManifestEntry>(this.manifestKey);

    if (entry) {
      const keys = new Set(entry.keys);
      keys.delete(key);

      if (keys.size > 0) {
        return this.cache.set(this.manifestKey, {keys: [...keys]});
      }

      return this.cache.remove(this.manifestKey);
    }
  }

  get(): MaybePromise<KeyManifestEntry | undefined> {
    return this.cache.get<KeyManifestEntry>(this.manifestKey);
  }

  clear(): MaybePromise<void> {
    return this.cache.remove(this.manifestKey);
  }

  private createManifestKeyFrom(clientId: string): string {
    return `${CACHE_KEY_PREFIX}::${clientId}::manifest`;
  }
}
