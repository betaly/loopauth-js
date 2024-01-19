import {AuthClientOptions, OptionsWithAuthorizationParams} from '@loopauth/client';

export type CacheProvider = 'memory' | 'localstorage';
export type TransactionStorageProvider = 'cookie' | 'session';

export interface WebAuthClientOptions extends AuthClientOptions {
  cacheProvider?: CacheProvider;
  transactionStorageProvider?: TransactionStorageProvider;
}

export interface PopupLoginOptions extends OptionsWithAuthorizationParams {}

export interface PopupConfigOptions {
  /**
   * The number of seconds to wait for a popup response before
   * throwing a timeout error. Defaults to 60s
   */
  timeoutInSeconds?: number;

  /**
   * Accepts an already-created popup window to use. If not specified, the SDK
   * will create its own. This may be useful for platforms like iOS that have
   * security restrictions around when popups can be invoked (e.g. from a user click event)
   */
  popup?: any;
}

export interface GetTokenWithPopupOptions extends PopupLoginOptions {
  /**
   * When `off`, ignores the cache and always sends a request to Auth.
   * When `cache-only`, only reads from the cache and never sends a request to Auth.
   * Defaults to `on`, where it both reads from the cache and sends a request to Auth as needed.
   */
  cacheMode?: 'on' | 'off' | 'cache-only';
}
