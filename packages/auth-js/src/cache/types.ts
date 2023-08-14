import {User} from '../types';

export interface DecodedToken {
  user: User;
}

export interface IdTokenEntry {
  idToken: string;
  decodedToken: DecodedToken;
}

export type CacheEntry = {
  clientId: string;
  audience?: string;
  idToken?: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  decodedToken?: DecodedToken;
};

export type WrappedCacheEntry = {
  body: Partial<CacheEntry>;
  expiresAt: number;
};

export type KeyManifestEntry = {
  keys: string[];
};

export type Cacheable = WrappedCacheEntry | KeyManifestEntry;

export type MaybePromise<T> = Promise<T> | T;

export interface ICache {
  set<T = Cacheable>(key: string, entry: T): MaybePromise<void>;

  get<T = Cacheable>(key: string): MaybePromise<T | undefined>;

  remove(key: string): MaybePromise<void>;

  allKeys?(): MaybePromise<string[]>;
}
