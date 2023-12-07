import {expect} from '@jest/globals';

import * as utils from '../../../utils';
import {TEST_AUTH_CLIENT_QUERY_STRING, TEST_CLIENT_CHALLENGE, TEST_CLIENT_ID, TEST_DOMAIN} from '../../constants';
import {InMemoryAsyncCacheNoKeys} from '../cache/shared';
import {fetchResponse, loginWithRedirectFn, prepareClientMocks} from './helpers';

jest.mock('../../../tokens');

jest.spyOn(utils, 'stringToBase64UrlEncoded').mockReturnValue(TEST_CLIENT_CHALLENGE);

describe('AuthClient', () => {
  const {setup, mockWindow, mockFetch} = prepareClientMocks();
  // const assertPost = assertPostFn(mockFetch);
  const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

  describe('logout()', () => {
    it('do nothing without access token', async () => {
      const client = setup();

      await client.logout();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('open url with returnTo param', async () => {
      const client = setup();

      const params = {
        client_id: TEST_CLIENT_ID,
        returnTo: 'http://localhost:3000',
      };

      await loginWithRedirect(client);
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          success: true,
          key: '123',
        }),
      );
      await client.logout({logoutParams: {returnTo: params.returnTo}});

      expect(mockFetch).lastCalledWith(
        `https://${TEST_DOMAIN}/logout?${new URLSearchParams(params).toString()}${TEST_AUTH_CLIENT_QUERY_STRING}`,
        expect.anything(),
      );
    });

    it('clears the cache for the global clientId', async () => {
      const client = setup();

      jest.spyOn(client['cacheManager'], 'clear').mockReturnValueOnce(Promise.resolve());

      await client.logout();

      expect(client['cacheManager']['clear']).toHaveBeenCalledWith(TEST_CLIENT_ID);
    });

    it('clears the cache for the provided clientId', async () => {
      const client = setup();

      jest.spyOn(client['cacheManager'], 'clear').mockReturnValueOnce(Promise.resolve());

      await client.logout({clientId: 'client_123'});

      expect(client['cacheManager']['clear']).toHaveBeenCalledWith('client_123');
      expect(client['cacheManager']['clear']).not.toHaveBeenCalledWith(TEST_CLIENT_ID);
    });

    it('clears the cache for all client ids', async () => {
      const client = setup();

      jest.spyOn(client['cacheManager'], 'clear').mockReturnValueOnce(Promise.resolve());

      await client.logout({clientId: null});

      expect(client['cacheManager']['clear']).toHaveBeenCalled();
      expect(client['cacheManager']['clear']).not.toHaveBeenCalledWith(TEST_CLIENT_ID);
    });

    it('can access isAuthenticated immediately after local logout', async () => {
      const client = setup();

      await loginWithRedirect(client);
      expect(await client.isAuthenticated()).toBe(true);
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          success: true,
          key: '123',
        }),
      );
      await client.logout();
      expect(await client.isAuthenticated()).toBe(false);
    });

    it('can access isAuthenticated immediately after local logout when using a custom async cache', async () => {
      const client = setup({
        cache: new InMemoryAsyncCacheNoKeys(),
      });

      await loginWithRedirect(client);
      expect(await client.isAuthenticated()).toBe(true);
      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          success: true,
          key: '123',
        }),
      );
      await client.logout();
      expect(await client.isAuthenticated()).toBe(false);
    });
  });
});
