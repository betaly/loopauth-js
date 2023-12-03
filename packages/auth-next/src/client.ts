import {NodeClient} from '@loopauth/auth-node';

import {CookieCache} from './cookie-cache';
import {CookieStorage} from './cookie-storage';
import {NextClientOptions} from './types';

export * from './types';

export class NextBaseClient {
  protected cache?: CookieCache;
  protected navigateUrl?: string;

  constructor(
    protected options: NextClientOptions,
    protected Client: typeof NodeClient,
  ) {}

  protected createNodeClient(cache: CookieCache, openUrl?: (url: string) => void): NodeClient {
    this.cache = cache;
    return new this.Client({
      cache,
      transactionStorage: new CookieStorage(cache),
      ...this.options,
      openUrl: url => {
        this.navigateUrl = url;
      },
    });
  }
}
