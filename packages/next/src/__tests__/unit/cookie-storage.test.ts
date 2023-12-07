import * as crypto from 'crypto';

import {CookieCache} from '../../cookie-cache';
import {CookieStorage} from '../../cookie-storage';

const ID_TOKEN = 'idToken';

const makeCache = async () =>
  CookieCache.create(
    {
      secret: 'secret',
      crypto: crypto as Crypto,
    },
    'cookie',
  );

describe('CookieStorage', () => {
  describe('Basic functions', () => {
    it('should set and get item', async () => {
      const cache = await makeCache();
      const storage = new CookieStorage(cache);
      await storage.set(ID_TOKEN, 'value');
      await expect(storage.get(ID_TOKEN)).resolves.toBe('value');
    });

    it('should remove item', async () => {
      const cache = await makeCache();
      const storage = new CookieStorage(cache);
      await storage.set(ID_TOKEN, 'value');
      await storage.remove(ID_TOKEN);
      await expect(storage.get(ID_TOKEN)).resolves.toBeUndefined();
    });

    it('should remove item', async () => {
      const cache = await makeCache();
      const storage = new CookieStorage(cache);
      await storage.set(ID_TOKEN, 'value');
      await storage.remove(ID_TOKEN);
      await expect(storage.get(ID_TOKEN)).resolves.toBeUndefined();
    });

    it('should destroy', async () => {
      const cache = await makeCache();
      const storage = new CookieStorage(cache);
      await storage.set(ID_TOKEN, 'value');
      await storage.clear();
      await expect(storage.get(ID_TOKEN)).resolves.toBeUndefined();
    });
  });
});
