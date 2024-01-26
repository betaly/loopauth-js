import {
  AuthClient,
  CacheKey,
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
  GenericError,
  InMemoryCache,
  retryPromise,
  TimeoutError,
} from '@loopauth/client';

import {
  CACHE_PROVIDER_MEMORY,
  DEFAULT_POPUP_CONFIG_OPTIONS,
  GET_TOKEN_SILENTLY_LOCK_KEY,
  TRANSACTION_STORAGE_SESSION,
} from './constants';
import {CookieStorage} from './cookie-storage';
import {LocalStorageCache} from './localstorage-cache';
import acquireLock from './lock';
import {SessionStorage} from './session-storage';
import {GetTokenWithPopupOptions, PopupConfigOptions, PopupLoginOptions, WebAuthClientOptions} from './types';
import {openPopup, runPopup} from './utils';

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

  /**
   * ```js
   * try {
   *  await auth.loginWithPopup(options);
   * } catch(e) {
   *  if (e instanceof PopupCancelledError) {
   *    // Popup was closed before login completed
   *  }
   * }
   * ```
   *
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   *
   * IMPORTANT: This method has to be called from an event handler
   * that was started by the user like a button click, for example,
   * otherwise the popup will be blocked in most browsers.
   *
   * @param options
   * @param config
   */
  public async loginWithPopup(options?: PopupLoginOptions, config?: PopupConfigOptions) {
    options = options || {};
    config = config || {};

    if (!config.popup) {
      config.popup = openPopup('');

      if (!config.popup) {
        throw new Error('Unable to open a popup for loginWithPopup - window.open returned `null`');
      }
    }

    const params = await this.prepareAuthorizeUrl(
      options.authorizationParams || {},
      {response_mode: 'web_message'},
      window.location.origin,
    );

    config.popup.location.href = params.url;

    const codeResult = await runPopup({
      ...config,
      timeoutInSeconds:
        config.timeoutInSeconds || this.options.authorizeTimeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
    });

    // TODO Is that necessary to support state?
    if (codeResult.state && params.state !== codeResult.state) {
      throw new GenericError('state_mismatch', 'Invalid state');
    }

    // const organization = options.authorizationParams?.organization || this.options.authorizationParams.organization;

    await this.requestToken(
      {
        // audience: params.audience,
        // scope: params.scope,
        // code_verifier: params.code_verifier,
        // grant_type: 'authorization_code',
        code: codeResult.code as string,
        // redirect_uri: params.redirect_uri,
      },
      // {
      //   nonceIn: params.nonce,
      //   organization,
      // },
    );
  }

  /**
   * ```js
   * const token = await auth0.getTokenWithPopup(options);
   * ```
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   *
   * @param options
   * @param config
   */
  public async getTokenWithPopup(options: GetTokenWithPopupOptions = {}, config: PopupConfigOptions = {}) {
    const localOptions = {
      ...options,
      authorizationParams: {
        ...this.options.authorizationParams,
        ...options.authorizationParams,
        // scope: getUniqueScopes(this.scope, options.authorizationParams?.scope),
      },
    };

    config = {
      ...DEFAULT_POPUP_CONFIG_OPTIONS,
      ...config,
    };

    await this.loginWithPopup(localOptions, config);

    const cache = await this.cacheManager.get(
      new CacheKey({
        // scope: localOptions.authorizationParams.scope,
        // audience: localOptions.authorizationParams.audience || 'default',
        clientId: this.options.clientId,
      }),
    );

    return cache!.accessToken;
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
