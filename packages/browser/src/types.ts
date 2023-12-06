import {AuthClientOptions} from '@loopauth/client';

export type CacheProvider = 'memory' | 'localstorage';
export type TransactionStorageProvider = 'cookie' | 'session';

export interface WebAuthClientOptions extends AuthClientOptions {
  cacheProvider?: CacheProvider;
  transactionStorageProvider?: TransactionStorageProvider;
}
