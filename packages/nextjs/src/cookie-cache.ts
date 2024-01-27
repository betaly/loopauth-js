import {Cacheable, ICache, MaybePromise} from '@loopauth/client';
import debugFactory from 'debug';
import {AnyObj} from 'tily/typings/types';

const debug = debugFactory('loopauth:next:cookie-cache');

export interface CookieCacheOptions {
  secret: string;
  crypto: Crypto;
}

export class CookieCache implements ICache {
  protected constructor(
    protected _data: AnyObj,
    protected encode: (value: AnyObj) => Promise<string>,
    protected persist?: (value: AnyObj) => void,
  ) {}

  get data(): AnyObj {
    return this._data;
  }

  static async create(
    {secret, crypto}: CookieCacheOptions,
    cookie: string,
    setCookie?: (value: string) => void,
  ): Promise<CookieCache> {
    const data = await unpack(cookie, secret, crypto);
    const encode = async (value: AnyObj) => pack(value, secret, crypto);
    const persist = async (value: AnyObj) => setCookie?.(await pack(value, secret, crypto));
    return new CookieCache(data, encode, persist);
  }

  allKeys(): MaybePromise<string[]> {
    return Object.keys(this._data);
  }

  get<T = Cacheable>(key: string): MaybePromise<T | undefined> {
    return this._data[key] as T | undefined;
  }

  remove(key: string): MaybePromise<void> {
    debug('removing %s', key);
    delete this._data[key];
    return undefined;
  }

  set<T = Cacheable>(key: string, entry: T): MaybePromise<void> {
    debug('setting %s %j', key, entry);
    this._data[key] = entry;
    return undefined;
  }

  clear(): MaybePromise<void> {
    debug('clearing');
    this._data = {};
    return undefined;
  }

  async values(): Promise<string> {
    return this.encode(this.data);
  }

  async save(): Promise<void> {
    debug('saving', this.data);
    return this.persist?.(this.data);
  }
}

export const pack = async <T>(data: T, secret: string, crypto: Crypto): Promise<string> => {
  const {ciphertext, iv} = await encrypt(JSON.stringify(data), secret, crypto);
  return `${ciphertext}.${iv}`;
};

export const unpack = async <T extends AnyObj>(cookie: string, secret: string, crypto: Crypto): Promise<T> => {
  try {
    const [ciphertext, iv] = cookie.split('.');

    if (!ciphertext || !iv) {
      return {} as T;
    }

    const decrypted = await decrypt(ciphertext, iv, secret, crypto);
    return JSON.parse(decrypted) as T;
  } catch {
    // Ignore invalid session
  }

  return {} as T;
};

async function getKeyFromPassword(password: string, crypto: Crypto): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Convert the hash to a hex string
  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function encrypt(text: string, password: string, crypto: Crypto) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedPlaintext = new TextEncoder().encode(text);

  const secretKey = await crypto.subtle.importKey(
    'raw',
    Buffer.from(await getKeyFromPassword(password, crypto), 'hex'),
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt'],
  );

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    secretKey,
    encodedPlaintext,
  );

  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
  };
}

async function decrypt(ciphertext: string, iv: string, password: string, crypto: Crypto) {
  const secretKey = await crypto.subtle.importKey(
    'raw',
    Buffer.from(await getKeyFromPassword(password, crypto), 'hex'),
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt'],
  );

  const cleartext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: Buffer.from(iv, 'base64'),
    },
    secretKey,
    Buffer.from(ciphertext, 'base64'),
  );

  return new TextDecoder().decode(cleartext);
}
