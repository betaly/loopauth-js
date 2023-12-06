import {CACHE_KEY_PREFIX, Cacheable, ICache, MaybePromise} from '@loopauth/client';

export class LocalStorageCache implements ICache {
  public set<T = Cacheable>(key: string, entry: T) {
    localStorage.setItem(key, JSON.stringify(entry));
  }

  public get<T = Cacheable>(key: string): MaybePromise<T | undefined> {
    const json = window.localStorage.getItem(key);

    if (!json) return;

    try {
      return JSON.parse(json) as T;
      /* c8 ignore next 3 */
    } catch (e) {
      return;
    }
  }

  public remove(key: string) {
    localStorage.removeItem(key);
  }

  public allKeys() {
    return Object.keys(window.localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
  }
}
