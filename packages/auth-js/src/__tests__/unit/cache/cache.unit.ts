import {expect} from '@jest/globals';

import {CacheEntry, CacheKey, ICache, InMemoryCache} from '../../../cache';
import {TEST_ACCESS_TOKEN, TEST_CLIENT_ID, TEST_ID_TOKEN, dayInSeconds, nowSeconds} from '../../constants';

const cacheFactories = [
  {new: () => new InMemoryCache(), name: 'In-memory Cache'},
  // {
  //   new: () => new InMemoryAsyncCacheNoKeys(),
  //   name: 'In-memory async cache with no allKeys',
  // },
];

const defaultEntry: CacheEntry = {
  clientId: TEST_CLIENT_ID,
  idToken: TEST_ID_TOKEN,
  accessToken: TEST_ACCESS_TOKEN,
  expiresIn: dayInSeconds,
  decodedToken: {
    user: {id: 'test', name: 'Test'},
  },
};

cacheFactories.forEach(cacheFactory => {
  describe(cacheFactory.name, () => {
    let cache: ICache;

    beforeEach(() => {
      cache = cacheFactory.new();
    });

    it('returns undefined when there is no data', async () => {
      expect(await cache.get('some-fictional-key')).toBeFalsy();
    });

    it('retrieves values from the cache', async () => {
      const data = {
        ...defaultEntry,
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            exp: nowSeconds() + dayInSeconds,
            name: 'Test',
          },
          user: {id: 'test', name: 'Test'},
        },
      };

      const cacheKey = CacheKey.fromCacheEntry(data);

      await cache.set(cacheKey.toKey(), data);
      expect(await cache.get<CacheEntry>(cacheKey.toKey())).toStrictEqual(data);
    });

    it('retrieves values from the cache when scopes do not match', async () => {
      const data = {
        ...defaultEntry,
        scope: 'the_scope the_scope2',
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            exp: nowSeconds() + dayInSeconds,
            name: 'Test',
          },
          user: {id: 'test', name: 'Test'},
        },
      };

      const cacheKey = new CacheKey({
        clientId: TEST_CLIENT_ID,
      });

      await cache.set(cacheKey.toKey(), data);
      expect(await cache.get<CacheEntry>(cacheKey.toKey())).toStrictEqual(data);
    });

    it('retrieves values from the cache when scopes do not match and multiple scopes are provided in a different order', async () => {
      const data = {
        ...defaultEntry,
        scope: 'the_scope the_scope2 the_scope3',
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            exp: nowSeconds() + dayInSeconds,
            name: 'Test',
          },
          user: {id: 'test', name: 'Test'},
        },
      };

      const cacheKey = new CacheKey({
        clientId: TEST_CLIENT_ID,
      });

      await cache.set(cacheKey.toKey(), data);
      expect(await cache.get<CacheEntry>(cacheKey.toKey())).toStrictEqual(data);
    });

    it('can remove an item from the cache', async () => {
      const cacheKey = CacheKey.fromCacheEntry(defaultEntry).toKey();

      await cache.set(cacheKey, defaultEntry);
      expect(await cache.get<CacheEntry>(cacheKey)).toStrictEqual(defaultEntry);
      await cache.remove(cacheKey);
      expect(await cache.get(cacheKey)).toBeFalsy();
    });
  });
});
