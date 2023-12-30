import {DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS} from '@loopauth/client';

import {PopupConfigOptions} from './types';

/**
 * @ignore
 */
export const GET_TOKEN_SILENTLY_LOCK_KEY = 'auth.lock.getTokenSilently';

export const TRANSACTION_STORAGE_SESSION = 'session';
export const TRANSACTION_STORAGE_COOKIE = 'cookie';

export const CACHE_PROVIDER_MEMORY = 'memory';
export const CACHE_PROVIDER_LOCAL_STORAGE = 'localstorage';

/**
 * @ignore
 */
export const DEFAULT_POPUP_CONFIG_OPTIONS: PopupConfigOptions = {
  timeoutInSeconds: DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
};
