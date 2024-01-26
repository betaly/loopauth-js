import UrlSafer from 'urlsafer';

import * as utils from '../../../utils';
import version from '../../../version';
import {
  TEST_ACCESS_TOKEN,
  TEST_AUTH_PROVIDER,
  TEST_CLIENT_CHALLENGE,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_DOMAIN,
  TEST_REDIRECT_URI,
} from '../../constants';
import {expectToHaveBeenCalledWithAuthClientParam, expectToHaveBeenCalledWithHash} from '../../helpers';
import {assertPostFn, assertUrlEquals, loginWithRedirectFn, prepareClientMocks} from './helpers';

jest.mock('../../../tokens');

const tokenVerifier = require('../../../tokens').verify;

jest.spyOn(utils, 'stringToBase64UrlEncoded').mockReturnValue(TEST_CLIENT_CHALLENGE);

describe('AuthClient', () => {
  const {setup, mockFetch, mockWindow} = prepareClientMocks();

  const assertPost = assertPostFn(mockFetch);
  const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

  describe('loginWithRedirect', () => {
    it('should log the user in and get the token when not using useFormData', async () => {
      const client = setup({
        useFormData: false,
      });

      await loginWithRedirect(client);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, `/auth/${TEST_AUTH_PROVIDER}`, {
        client_id: TEST_CLIENT_ID,
        redirect_uri: TEST_REDIRECT_URI,
        client_challenge: TEST_CLIENT_CHALLENGE,
        client_challenge_method: 'S256',
        response_mode: 'query',
        response_type: 'code',
        state: expect.any(String),
        ts: expect.any(String),
      });

      assertPost(
        'https://auth_domain/auth/token',
        {
          // redirect_uri: TEST_REDIRECT_URI,
          clientId: TEST_CLIENT_ID,
          code: TEST_CODE,
        },
        {
          'LoopAuth-Client': UrlSafer.encode(
            JSON.stringify({
              name: 'auth-js',
              version: version,
            }),
          ),
        },
      );
    });

    it('should log the user in and get the token', async () => {
      const client = setup({
        useFormData: true,
      });

      await loginWithRedirect(client);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, `/auth/${TEST_AUTH_PROVIDER}`, {
        client_id: TEST_CLIENT_ID,
        redirect_uri: TEST_REDIRECT_URI,
        client_challenge: TEST_CLIENT_CHALLENGE,
        client_challenge_method: 'S256',
        response_mode: 'query',
        response_type: 'code',
        state: expect.any(String),
        ts: expect.any(String),
      });

      assertPost(
        'https://auth_domain/auth/token',
        {
          // redirect_uri: TEST_REDIRECT_URI,
          clientId: TEST_CLIENT_ID,
          code: TEST_CODE,
        },
        {
          'LoopAuth-Client': UrlSafer.encode(
            JSON.stringify({
              name: 'auth-js',
              version: version,
            }),
          ),
        },
        undefined,
        false,
      );
    });

    it('should log the user in using different default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';

      const client = setup({
        authorizationParams: {
          redirect_uri,
        },
      });

      await loginWithRedirect(client);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        `/auth/${TEST_AUTH_PROVIDER}`,
        {
          redirect_uri,
        },
        false,
      );
    });

    it('should log the user in when overriding default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';

      const client = setup({
        authorizationParams: {
          redirect_uri,
        },
      });

      await loginWithRedirect(client, {
        authorizationParams: {
          redirect_uri: 'https://my-redirect-uri/callback',
        },
      });

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        `/auth/${TEST_AUTH_PROVIDER}`,
        {
          redirect_uri: 'https://my-redirect-uri/callback',
        },
        false,
      );
    });

    it('should log the user in by calling window.location.replace when specifying it as openUrl', async () => {
      const client = setup();

      await loginWithRedirect(client, {
        authorizationParams: {
          audience: 'test_audience',
        },
        openUrl: async url => window.location.replace(url),
      });

      const url = new URL(mockWindow.location.replace.mock.calls[0][0]);

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        `/auth/${TEST_AUTH_PROVIDER}`,
        {
          audience: 'test_audience',
        },
        false,
      );
    });

    it('skips `window.location.assign` when `options.openUrl` is provided', async () => {
      const client = setup();

      await loginWithRedirect(client, {
        authorizationParams: {
          audience: 'test_audience',
        },
        openUrl: async () => {},
      });

      expect(window.location.assign).not.toHaveBeenCalled();
    });

    it('should log the user in with custom params', async () => {
      const client = setup();

      await loginWithRedirect(client, {
        authorizationParams: {
          audience: 'test_audience',
        },
      });

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        `/auth/${TEST_AUTH_PROVIDER}`,
        {
          audience: 'test_audience',
        },
        false,
      );
    });

    it('should log the user in using offline_access when using refresh tokens', async () => {
      const client = setup();

      await loginWithRedirect(client);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, `/auth/${TEST_AUTH_PROVIDER}`, {}, false);
    });

    it('should log the user in and get the user', async () => {
      const client = setup();
      await loginWithRedirect(client);

      const expectedUser = {id: 'me'};

      expect(await client.getUser()).toEqual(expectedUser);
    });

    it('should log the user in with custom authClient', async () => {
      const authClient = {name: '__test_client__', version: '0.0.0'};
      const client = setup({authClient});

      await loginWithRedirect(client);

      expectToHaveBeenCalledWithAuthClientParam(mockWindow.location.assign, authClient);
    });

    it('should log the user in with custom fragment', async () => {
      const authClient = {name: '__test_client__', version: '0.0.0'};
      const client = setup({authClient});
      await loginWithRedirect(client, {fragment: '/reset'});
      expectToHaveBeenCalledWithHash(mockWindow.location.assign, '#/reset');
    });

    it('should throw an error on token failure', async () => {
      const client = setup();

      await expect(
        loginWithRedirect(client, undefined, {
          token: {
            success: false,
          },
        }),
      ).rejects.toThrowError('HTTP error. Unable to fetch https://auth_domain/auth/token');
    });

    it('calls `tokenVerifier.verify` with the `access_token` from in the auth/token response', async () => {
      const client = setup({
        issuer: 'test-123.client.com',
      });

      await loginWithRedirect(client);
      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'https://test-123.client.com/',
          token: TEST_ACCESS_TOKEN,
        }),
      );
    });

    it('saves into cache', async () => {
      const client = setup();

      jest.spyOn(client['cacheManager'], 'set');

      await loginWithRedirect(client);

      expect(client['cacheManager']['set']).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: TEST_CLIENT_ID,
          accessToken: TEST_ACCESS_TOKEN,
          expiresIn: 86400,
        }),
      );
    });

    it('saves user information into the cache', async () => {
      const client = setup();

      const mockDecodedToken = {
        user: {id: 'sub'},
      };
      tokenVerifier.mockReturnValue(mockDecodedToken);

      jest.spyOn(client['cacheManager'], 'setIdToken');

      await loginWithRedirect(client);

      expect(client['cacheManager']['setIdToken']).toHaveBeenCalledWith(
        TEST_CLIENT_ID,
        TEST_ACCESS_TOKEN,
        mockDecodedToken,
      );
    });

    it('should not include client options on the URL', async () => {
      // ** IMPORTANT **: if adding a new client option, ensure it is added to the destructure
      // list in AuthClient._getParams so that it is not sent to the IdP
      const client = setup({
        nowProvider: () => Date.now(),
      });

      await loginWithRedirect(client);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, `/auth/${TEST_AUTH_PROVIDER}`, {
        client_id: TEST_CLIENT_ID,
        redirect_uri: TEST_REDIRECT_URI,
        client_challenge: TEST_CLIENT_CHALLENGE,
        client_challenge_method: 'S256',
        response_mode: 'query',
        response_type: 'code',
        state: expect.any(String),
        ts: expect.any(String),
      });
    });
  });
});
