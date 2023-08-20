import {AuthClientOptions} from '@loopauth/auth-js';

export type CacheProvider = 'memory' | 'localstorage';
export type TransactionStorageProvider = 'cookie' | 'session';

export interface WebAuthClientOptions extends AuthClientOptions {
  cacheProvider?: CacheProvider;
  transactionStorageProvider?: TransactionStorageProvider;
}
