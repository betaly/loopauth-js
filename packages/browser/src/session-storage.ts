import {ClientStorage} from '@loopauth/client';

/**
 * A storage protocol for marshalling data to/from session storage
 */
export const SessionStorage = {
  get<T extends object>(key: string) {
    /* c8 ignore next 3 */
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const value = sessionStorage.getItem(key);

    if (value == null) {
      return;
    }

    return <T>JSON.parse(value);
  },

  set(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string) {
    sessionStorage.removeItem(key);
  },
} as ClientStorage;
