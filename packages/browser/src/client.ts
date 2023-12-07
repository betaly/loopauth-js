import {AuthClient, InMemoryCache, retryPromise, TimeoutError} from '@loopauth/client';

import {CACHE_PROVIDER_MEMORY, GET_TOKEN_SILENTLY_LOCK_KEY, TRANSACTION_STORAGE_SESSION} from './constants';
import {CookieStorage} from './cookie-storage';
import {LocalStorageCache} from './localstorage-cache';
import acquireLock from './lock';
import {SessionStorage} from './session-storage';
import {WebAuthClientOptions} from './types';

export class WebAuthClient extends AuthClient<WebAuthClientOptions> {
  constructor(options: WebAuthClientOptions) {
    super({
      openUrl: async (url: string) => window.location.assign(url),
      ...options,
    });
  }

  public async handleRedirectCallback(url = window.location.href) {
    return super.handleRedirectCallback(url);
  }

  protected openUrlWithFallback(url: string) {
    window.location.assign(url);
  }

  protected initTransactionStorage() {
    if (this.options.transactionStorage) {
      return this.options.transactionStorage;
    }
    const transactionStorageProvider = this.options.transactionStorageProvider || TRANSACTION_STORAGE_SESSION;
    switch (transactionStorageProvider) {
      case 'cookie':
        return CookieStorage;
      case 'session':
        return SessionStorage;
      default:
        throw new Error(`Invalid transaction storage provider: ${this.options.transactionStorageProvider}`);
    }
  }

  protected initCache() {
    if (this.options.cache) {
      return this.options.cache;
    }
    const cacheProvider = this.options.cacheProvider || CACHE_PROVIDER_MEMORY;
    switch (cacheProvider) {
      case 'memory':
        return new InMemoryCache();
      case 'localstorage':
        return new LocalStorageCache();
      default:
        throw new Error(`Invalid cache provider: ${this.options.cacheProvider}`);
    }
  }

  protected async runInLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const lock = await acquireLock();
    if (await retryPromise(() => lock.acquireLock(GET_TOKEN_SILENTLY_LOCK_KEY, 5000), 10)) {
      try {
        window.addEventListener('pagehide', this._releaseLockOnPageHide);
        return await fn();
      } finally {
        window.removeEventListener('pagehide', this._releaseLockOnPageHide);
        await lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY);
      }
    } else {
      throw new TimeoutError();
    }
  }

  private _releaseLockOnPageHide = async () => {
    const lock = await acquireLock();
    await lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY);
    window.removeEventListener('pagehide', this._releaseLockOnPageHide);
  };
}
