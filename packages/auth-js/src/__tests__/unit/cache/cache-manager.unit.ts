import {expect} from '@jest/globals';

import {CACHE_KEY_PREFIX, CacheKey, CacheManager, InMemoryCache} from '../../../cache';
import {CacheKeyManifest} from '../../../cache/key-manifest';
import {CacheEntry, DecodedToken, ICache} from '../../../cache/types';
import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_ID_TOKEN,
  TEST_REFRESH_TOKEN,
  dayInSeconds,
  nowSeconds,
} from '../../constants';
import {InMemoryAsyncCacheNoKeys} from './shared';

const defaultKey = new CacheKey({
  clientId: TEST_CLIENT_ID,
});

const defaultData: CacheEntry = {
  clientId: TEST_CLIENT_ID,
  idToken: TEST_ID_TOKEN,
  accessToken: TEST_ACCESS_TOKEN,
  expiresIn: dayInSeconds,
  decodedToken: {
    user: {id: 'test', name: 'Test'},
  },
};

const cacheFactories = [
  // {new: () => new LocalStorageCache(), name: 'LocalStorageCache'},
  {
    new: () => new InMemoryCache(),
    name: 'Cache with allKeys',
  },
  {
    new: () => new InMemoryAsyncCacheNoKeys(),
    name: 'Async cache using key manifest',
  },
];

cacheFactories.forEach(cacheFactory => {
  describe(`CacheManager using ${cacheFactory.name}`, () => {
    let manager: CacheManager;
    let cache: ICache;
    let keyManifest: CacheKeyManifest | undefined;

    beforeEach(() => {
      cache = cacheFactory.new();

      keyManifest = !cache.allKeys ? new CacheKeyManifest(cache, TEST_CLIENT_ID) : undefined;

      manager = new CacheManager(cache, keyManifest);

      if (keyManifest) {
        ['get', 'add', 'clear'].forEach(method => jest.spyOn(manager['keyManifest'] as any, method));
      }
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('returns undefined when there is nothing in the cache', async () => {
      const result = await manager.get(defaultKey);

      expect(result).toBeFalsy();
    });

    it('sets up the key manifest correctly', () => {
      if (cache.allKeys) {
        expect(manager['keyManifest']).toBeUndefined();
      } else {
        expect(manager['keyManifest']).toBeTruthy();
      }
    });

    it('should return an entry from the cache if any of the scopes match', async () => {
      const data = {
        ...defaultData,
      };

      await manager.set(data);

      const key = new CacheKey({
        clientId: TEST_CLIENT_ID,
      });

      expect(await manager.get(key)).toStrictEqual(data);
    });

    it('should return an entry from the cache if no scopes provided', async () => {
      const data = {
        ...defaultData,
      };

      await manager.set(data);

      const key = new CacheKey({
        clientId: TEST_CLIENT_ID,
      });

      expect(await manager.get(key)).toStrictEqual(data);
    });

    it('should return an entry directly from the cache if the key matches exactly', async () => {
      const data = {
        ...defaultData,
      };

      await manager.set(data);

      const key = new CacheKey({
        clientId: TEST_CLIENT_ID,
      });

      expect(await manager.get(key)).toStrictEqual(data);
    });

    it('should not fetch from the cache if allKeys returns empty array of keys', async () => {
      // Simulate a cache implementation that returns an empty array for 'allKeys'
      // but also has a valid entry in there - this tries to test a custom cache implementation
      // that doesn't return an expected value for `allKeys`, it should just behave
      // as any other entry that returns not found.
      const cache = new InMemoryCache();
      const getSpy = jest.spyOn(cache, 'get');
      const manager = new CacheManager(cache);

      jest.spyOn(cache, 'allKeys').mockReturnValue([]);
      cache.set(defaultKey.toKey(), defaultData);

      expect(await manager.get(new CacheKey({clientId: 'test'}))).not.toBeDefined();

      // Make sure we don't try and get a cache value with a key of `undefined`
      expect(getSpy).not.toHaveBeenCalledWith(undefined);
    });

    if (keyManifest) {
      it('should update the key manifest when the key has only been added to the underlying cache', async () => {
        const manifestKey = `${CACHE_KEY_PREFIX}::${defaultData.clientId}`;

        await manager.set(defaultData);

        // Remove the manifest entry that is created by the manifest
        await cache.remove(manifestKey);

        const result = await manager.get(defaultKey);

        expect(result).toStrictEqual(defaultData);
        expect(await cache.get(manifestKey)).toBeTruthy();
      });
    }

    it('returns undefined from the cache when expiresIn < expiryAdjustmentSeconds', async () => {
      const data = {
        ...defaultData,
        expiresIn: 40,
      };

      await manager.set(data);

      expect(
        await manager.get(
          new CacheKey({
            clientId: TEST_CLIENT_ID,
          }),
          60,
        ),
      ).toBeFalsy();
    });

    it('returns undefined if the item was not found in the underlying cache', async () => {
      const cacheSpy = jest.spyOn(cache, 'remove');

      await manager.set(defaultData);
      expect(await manager.get(defaultKey)).toStrictEqual(defaultData);
      await cache.remove(defaultKey.toKey());
      expect(await manager.get(defaultKey)).toBeFalsy();
      expect(cacheSpy).toHaveBeenCalledWith(defaultKey.toKey());
    });

    describe('when refresh tokens are used', () => {
      it('strips everything except the refresh token when expiry has been reached', async () => {
        const now = Date.now();
        const realDateNow = Date.now.bind(global.Date);

        const data = {
          ...defaultData,
          refreshToken: TEST_REFRESH_TOKEN,
          decodedToken: {
            claims: {
              __raw: TEST_ID_TOKEN,
              name: 'Test',
              exp: nowSeconds() + dayInSeconds * 2,
            },
            user: {id: 'test', name: 'Test'},
          },
        };

        await manager.set(data);

        const cacheKey = CacheKey.fromCacheEntry(data);

        // Test that the cache state is normal up until just before the expiry time..
        expect(await manager.get(cacheKey)).toStrictEqual(data);

        // Advance the time to just past the expiry..
        const dateNowStub = jest.fn(() => now + (dayInSeconds + 60) * 1000);
        global.Date.now = dateNowStub;

        expect(await manager.get(cacheKey)).toStrictEqual({
          refreshToken: TEST_REFRESH_TOKEN,
        });

        global.Date.now = realDateNow;
      });
    });

    it('reads from the cache when expiresIn > date.now', async () => {
      const data = {
        ...defaultData,
        expiresIn: 70,
      };

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      const result = await manager.get(cacheKey, 60);

      // And test that the cache has been emptied
      expect(result).toBeTruthy();
    });

    it('reads from the cache when expiresIn > date.now using custom now provider', async () => {
      const now = Date.now();
      const data = {
        ...defaultData,
        expiresIn: 50,
      };
      const expiryAdjustmentSeconds = 60;

      const provider = jest.fn().mockResolvedValue(Date.now());
      const manager = new CacheManager(cache, keyManifest, provider);

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      // Move back in time to ensure the token is valid
      provider.mockResolvedValue(now - (expiryAdjustmentSeconds - data.expiresIn) * 1000);

      const result = await manager.get(cacheKey, expiryAdjustmentSeconds);

      // And test that the cache has been emptied
      expect(result).toBeTruthy();
    });

    it('expires the cache on read when the date.now > expiresIn', async () => {
      const now = Date.now();
      const realDateNow = Date.now.bind(global.Date);
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            name: 'Test',
            exp: nowSeconds() + dayInSeconds * 2,
          },
          user: {id: 'test', name: 'Test'},
        },
      };

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);

      global.Date.now = dateNowStub;

      const result = await manager.get(cacheKey);

      global.Date.now = realDateNow;

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(`@@loopauth@@::${data.clientId}`);
      }
    });

    it('expires the cache on read when the date.now > expiresIn when using custom now provider with a promise', async () => {
      const now = Date.now();
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            name: 'Test',
            exp: nowSeconds() + dayInSeconds * 2,
          },
          user: {id: 'test', name: 'Test'},
        },
      };

      const provider = jest.fn().mockResolvedValue(now);
      const manager = new CacheManager(cache, keyManifest, provider);

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      provider.mockResolvedValue((now + dayInSeconds + 100) * 1000);

      const result = await manager.get(cacheKey);

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(`@@loopauth@@::${data.clientId}`);
      }
    });

    it('expires the cache on read when the date.now > expiresIn when using custom now provider', async () => {
      const now = Date.now();
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        decodedToken: {
          claims: {
            __raw: TEST_ID_TOKEN,
            name: 'Test',
            exp: nowSeconds() + dayInSeconds * 2,
          },
          user: {id: 'test', name: 'Test'},
        },
      };

      const provider = jest.fn().mockReturnValue(now);
      const manager = new CacheManager(cache, keyManifest, provider);

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      provider.mockReturnValue((now + dayInSeconds + 100) * 1000);

      const result = await manager.get(cacheKey);

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(`@@loopauth@@::${data.clientId}`);
      }
    });

    it('expires the cache on read when the date.now > token.exp', async () => {
      const now = Date.now();
      const realDateNow = Date.now.bind(global.Date);
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        expiresIn: dayInSeconds * 120,
      };

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      const dateNowStub = jest.fn(() => (now + dayInSeconds + 100) * 1000);
      global.Date.now = dateNowStub;

      const result = await manager.get(cacheKey);

      global.Date.now = realDateNow;

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(`@@loopauth@@::${data.clientId}`);
      }
    });

    it('expires the cache on read when the date.now > token.exp when using custom now provider with a promise', async () => {
      const now = Date.now();
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        expiresIn: dayInSeconds * 120,
      };

      const provider = jest.fn().mockResolvedValue(now);
      const manager = new CacheManager(cache, keyManifest, provider);

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      provider.mockResolvedValue((now + dayInSeconds + 100) * 1000);

      const result = await manager.get(cacheKey);

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(`@@loopauth@@::${data.clientId}`);
      }
    });

    it('expires the cache on read when the date.now > token.exp when using custom now provider', async () => {
      const now = Date.now();
      const cacheRemoveSpy = jest.spyOn(cache, 'remove');

      const data = {
        ...defaultData,
        expiresIn: dayInSeconds * 120,
      };

      const provider = jest.fn().mockReturnValue(now);
      const manager = new CacheManager(cache, keyManifest, provider);

      await manager.set(data);

      const cacheKey = CacheKey.fromCacheEntry(data);

      // Test that the cache state is normal before we expire the data
      expect(await manager.get(cacheKey)).toStrictEqual(data);

      // Advance the time to just past the expiry..
      provider.mockReturnValue((now + dayInSeconds + 100) * 1000);

      const result = await manager.get(cacheKey);

      // And test that the cache has been emptied
      expect(result).toBeFalsy();

      // And that the data has been removed from the key manifest
      if (keyManifest) {
        expect(cacheRemoveSpy).toHaveBeenCalledWith(`@@loopauth@@::${data.clientId}`);
      }
    });

    it('clears all keys from the cache', async () => {
      const entry1 = {...defaultData};
      const entry2 = {...defaultData, clientId: 'some-other-client'};

      await manager.set(entry1);
      await manager.set(entry2);

      expect(await manager.get(CacheKey.fromCacheEntry(entry1))).toStrictEqual(entry1);
      expect(await manager.get(CacheKey.fromCacheEntry(entry2))).toStrictEqual(entry2);

      await manager.clear();
      expect(await manager.get(CacheKey.fromCacheEntry(entry1))).toBeFalsy();
      expect(await manager.get(CacheKey.fromCacheEntry(entry2))).toBeFalsy();
    });

    it('clears only the keys relating to a specific client ID from the cache', async () => {
      const entry1 = {...defaultData};
      const entry2 = {...defaultData, clientId: 'some-other-client'};

      await manager.set(entry1);
      await manager.set(entry2);

      expect(await manager.get(CacheKey.fromCacheEntry(entry1))).toStrictEqual(entry1);

      expect(await manager.get(CacheKey.fromCacheEntry(entry2))).toStrictEqual(entry2);

      await manager.clear(TEST_CLIENT_ID);
      expect(await manager.get(CacheKey.fromCacheEntry(entry1))).toBeFalsy();

      // Should not be removed as it has a different client ID from the manager instance
      expect(await manager.get(CacheKey.fromCacheEntry(entry2))).toStrictEqual(entry2);
    });

    describe('getIdToken', () => {
      beforeEach(async () => {
        await manager.clear();
      });

      it('should read from the id token cache if exists', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
        });

        await manager.setIdToken(
          defaultData.clientId,
          defaultData.idToken as string,
          defaultData.decodedToken as DecodedToken,
        );

        const cacheSpy = jest.spyOn(cache, 'get');

        const result = await manager.getIdToken(cacheKey);

        expect(cache.get).toHaveBeenCalledWith(
          new CacheKey(
            {
              clientId: TEST_CLIENT_ID,
            },
            CACHE_KEY_PREFIX,
            '@@user@@',
          ).toKey(),
        );
        expect(cache.get).toHaveBeenCalledTimes(1);
        expect(result).toBeDefined();

        cacheSpy.mockClear();
      });

      it('should read from the access token cache if not found in id token cache', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
        });

        await manager.set({
          ...defaultData,
        });

        const cacheSpy = jest.spyOn(cache, 'get');

        const result = await manager.getIdToken(cacheKey);

        expect(cache.get).toHaveBeenCalledWith(cacheKey.toKey());
        expect(cache.get).toHaveBeenCalledTimes(2);
        expect(result).toBeDefined();

        cacheSpy.mockClear();
      });

      it('should return undefined when nothing found', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
        });

        const cacheSpy = jest.spyOn(cache, 'get').mockImplementation(key => {
          if (key.indexOf('@@user@@') > -1) {
            return null;
          } else {
            return null;
          }
        });

        const result = await manager.getIdToken(cacheKey);

        expect(cache.get).toHaveBeenCalledWith(
          new CacheKey(
            {
              clientId: TEST_CLIENT_ID,
            },
            CACHE_KEY_PREFIX,
            '@@user@@',
          ).toKey(),
        );
        expect(cache.get).toHaveBeenCalledWith(cacheKey.toKey());
        expect(result).toBeUndefined();

        cacheSpy.mockClear();
      });

      it('should return undefined when no id token in access token cache', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
        });

        await manager.set({
          ...defaultData,

          idToken: undefined,
        });

        const result = await manager.getIdToken(cacheKey);

        expect(result).toBeUndefined();
      });

      it('should return undefined when no decoded token in access token cache', async () => {
        const cacheKey = new CacheKey({
          clientId: TEST_CLIENT_ID,
        });

        await manager.set({
          ...defaultData,

          decodedToken: undefined,
        });

        const result = await manager.getIdToken(cacheKey);

        expect(result).toBeUndefined();
      });

      // it('should return undefined if not found in id token cache and no scope set', async () => {
      //   const cacheKey = new CacheKey({
      //     clientId: TEST_CLIENT_ID,
      //   });
      //
      //   const cacheSpy = jest.spyOn(cache, 'get');
      //
      //   const result = await manager.getIdToken(cacheKey);
      //
      //   expect(cache.get).toHaveBeenCalledWith(
      //     new CacheKey(
      //       {
      //         clientId: TEST_CLIENT_ID,
      //       },
      //       CACHE_KEY_PREFIX,
      //       '@@user@@',
      //     ).toKey(),
      //   );
      //   expect(cache.get).toHaveBeenCalledTimes(1);
      //   expect(result).toBeUndefined();
      //
      //   cacheSpy.mockClear();
      // });
      // it('should return undefined if not found in id token cache and no audience set', async () => {
      //   const cacheKey = new CacheKey({
      //     clientId: TEST_CLIENT_ID,
      //   });
      //
      //   const cacheSpy = jest.spyOn(cache, 'get');
      //
      //   const result = await manager.getIdToken(cacheKey);
      //
      //   expect(cache.get).toHaveBeenCalledWith(
      //     new CacheKey(
      //       {
      //         clientId: TEST_CLIENT_ID,
      //       },
      //       CACHE_KEY_PREFIX,
      //       '@@user@@',
      //     ).toKey(),
      //   );
      //   expect(cache.get).toHaveBeenCalledTimes(1);
      //   expect(result).toBeUndefined();
      //
      //   cacheSpy.mockClear();
      // });
    });
  });
});
