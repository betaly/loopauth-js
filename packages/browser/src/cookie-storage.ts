import {ClientStorage, ClientStorageOptions} from '@loopauth/client';
import * as Cookies from 'es-cookie';

/**
 * A storage protocol for marshalling data to/from cookies
 */
export const CookieStorage = {
  get<T extends object>(key: string) {
    const value = Cookies.get(key);

    if (typeof value === 'undefined') {
      return;
    }

    return <T>JSON.parse(value);
  },

  set(key: string, value: unknown, options?: ClientStorageOptions): void {
    let cookieAttributes: Cookies.CookieAttributes = {};

    if ('https:' === window.location.protocol) {
      cookieAttributes = {
        secure: true,
        sameSite: 'none',
      };
    }

    if (options?.daysUntilExpire) {
      cookieAttributes.expires = options.daysUntilExpire;
    }

    if (options?.cookieDomain) {
      cookieAttributes.domain = options.cookieDomain;
    }

    Cookies.set(key, JSON.stringify(value), cookieAttributes);
  },

  remove(key: string, options?: ClientStorageOptions) {
    const cookieAttributes: Cookies.CookieAttributes = {};

    if (options?.cookieDomain) {
      cookieAttributes.domain = options.cookieDomain;
    }

    Cookies.remove(key, cookieAttributes);
  },
} as ClientStorage;
