import version from './version';

/**
 * @ignore
 */
export const DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS = 60;
/**
 * @ignore
 */
export const DEFAULT_SILENT_TOKEN_RETRY_COUNT = 3;

/**
 * @ignore
 */
export const DEFAULT_FETCH_TIMEOUT_MS = 10000;

export const TOKEN_EXPIRED_ERROR_MESSAGE = 'Token Expired';

export const TOKEN_INVALID_ERROR_MESSAGE = 'Token Invalid';

/**
 * @ignore
 */
export const DEFAULT_AUTH_CLIENT = {
  name: 'auth-js',
  version,
};

export const DEFAULT_NOW_PROVIDER = () => Date.now();
