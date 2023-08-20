import Lock from 'browser-tabs-lock';

import {AuthClient} from '../../client';
import {TimeoutError} from '../../errors';
import {retryPromise} from '../../promise-utils';
import {AuthClientOptions} from '../../types';
import {GET_TOKEN_SILENTLY_LOCK_KEY} from '../constants';

/**
 * @ignore
 */
const lock = new Lock();

export class WebAuthClient extends AuthClient {
  constructor(options: AuthClientOptions) {
    super({
      openUrl: async (url: string) => window.location.assign(url),
      ...options,
    });
  }

  public async handleRedirectCallback(url = window.location.href) {
    return super.handleRedirectCallback(url);
  }

  protected async runInLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
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
    await lock.releaseLock(GET_TOKEN_SILENTLY_LOCK_KEY);
    window.removeEventListener('pagehide', this._releaseLockOnPageHide);
  };
}
