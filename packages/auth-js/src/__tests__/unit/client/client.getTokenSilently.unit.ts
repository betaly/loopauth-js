// @ts-ignore
import {acquireLockSpy} from 'browser-tabs-lock';
import {urlSafeBase64} from '../../../base64';
import {DEFAULT_AUTH_CLIENT} from '../../../constants';
import * as fetches from '../../../fetch';
import * as utils from '../../../utils';
import {TEST_ACCESS_TOKEN, TEST_CLIENT_CHALLENGE, TEST_REFRESH_TOKEN} from '../../constants';
import {assertPostFn, getTokenSilentlyFn, loginWithRedirectFn, prepareClientMocks} from './helpers';

jest.mock('../../../tokens');

jest.spyOn(utils, 'stringToBase64UrlEncoded').mockReturnValue(TEST_CLIENT_CHALLENGE);

jest.spyOn(fetches, 'switchFetch');

describe('AuthClient', () => {
  const {setup, mockWindow, mockFetch} = prepareClientMocks();
  const assertPost = assertPostFn(mockFetch);
  const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);
  const getTokenSilently = getTokenSilentlyFn(mockWindow, mockFetch);

  afterEach(() => {
    acquireLockSpy.mockResolvedValue(true);
  });

  describe('getTokenSilently', () => {
    it('calls the token endpoint with the correct params when using refresh tokens and not using useFormData', async () => {
      const client = setup({
        useFormData: false,
      });

      await loginWithRedirect(client);

      mockFetch.mockReset();

      await getTokenSilently(client, {
        cacheMode: 'off',
      });

      assertPost(
        'https://auth_domain/auth/token-refresh',
        {
          refreshToken: TEST_REFRESH_TOKEN,
        },
        {
          'LoopAuth-Client': urlSafeBase64.encode(JSON.stringify(DEFAULT_AUTH_CLIENT)),
        },
      );
    });

    it('calls the token endpoint with the correct params when using refresh tokens and using useFormData', async () => {
      const client = setup({
        useFormData: true,
      });

      await loginWithRedirect(client);

      mockFetch.mockReset();

      await getTokenSilently(client, {
        cacheMode: 'off',
      });

      assertPost(
        'https://auth_domain/auth/token-refresh',
        {
          refreshToken: TEST_REFRESH_TOKEN,
        },
        {
          'LoopAuth-Client': urlSafeBase64.encode(JSON.stringify(DEFAULT_AUTH_CLIENT)),
        },
        undefined,
        false,
      );
    });

    it('calls the token endpoint with the correct params when passing redirect uri, using refresh tokens and not using useFormData', async () => {
      const client = setup({
        useFormData: false,
      });

      await loginWithRedirect(client);

      mockFetch.mockReset();

      await getTokenSilently(client, {
        cacheMode: 'off',
      });

      assertPost(
        'https://auth_domain/auth/token-refresh',
        {
          refreshToken: TEST_REFRESH_TOKEN,
        },
        {
          'LoopAuth-Client': urlSafeBase64.encode(JSON.stringify(DEFAULT_AUTH_CLIENT)),
        },
      );
    });

    it('calls the token endpoint with the correct params when passing redirect uri and using refresh tokens', async () => {
      const client = setup({
        useFormData: true,
      });

      await loginWithRedirect(client);

      mockFetch.mockReset();

      await getTokenSilently(client, {
        cacheMode: 'off',
      });

      assertPost(
        'https://auth_domain/auth/token-refresh',
        {
          refreshToken: TEST_REFRESH_TOKEN,
        },
        {
          'LoopAuth-Client': urlSafeBase64.encode(JSON.stringify(DEFAULT_AUTH_CLIENT)),
        },
        undefined,
        false,
      );
    });

    it('calls the token endpoint with the correct params when not providing any redirect uri, using refresh tokens and not using useFormData', async () => {
      const client = setup({
        useFormData: false,
        authorizationParams: {
          redirect_uri: undefined,
        },
      });

      await loginWithRedirect(client);

      mockFetch.mockReset();

      await getTokenSilently(client, {
        cacheMode: 'off',
      });

      assertPost(
        'https://auth_domain/auth/token-refresh',
        {
          refreshToken: TEST_REFRESH_TOKEN,
        },
        {
          'LoopAuth-Client': urlSafeBase64.encode(JSON.stringify(DEFAULT_AUTH_CLIENT)),
        },
      );
    });

    it('calls the token endpoint with the correct params when not providing any redirect uri and using refresh tokens', async () => {
      const client = setup({
        useFormData: true,
        authorizationParams: {
          redirect_uri: undefined,
        },
      });

      await loginWithRedirect(client);

      mockFetch.mockReset();

      await getTokenSilently(client, {
        cacheMode: 'off',
      });

      assertPost(
        'https://auth_domain/auth/token-refresh',
        {
          refreshToken: TEST_REFRESH_TOKEN,
        },
        {
          'LoopAuth-Client': urlSafeBase64.encode(JSON.stringify(DEFAULT_AUTH_CLIENT)),
        },
        undefined,
        false,
      );
    });

    it('uses the cache when expiresIn > constant leeway & refresh tokens are used', async () => {
      const client = setup();

      await loginWithRedirect(client, undefined, {
        token: {
          response: {expiresIn: 70},
        },
      });

      mockFetch.mockReset();

      await getTokenSilently(client);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not refresh the token when cacheMode is cache-only', async () => {
      const client = setup();
      await loginWithRedirect(client, undefined, {
        token: {
          response: {expiresIn: 70, access_token: TEST_ACCESS_TOKEN},
        },
      });

      mockFetch.mockReset();

      const token = await getTokenSilently(client, {cacheMode: 'cache-only'});

      expect(token).toBe(TEST_ACCESS_TOKEN);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not refresh the token when cacheMode is cache-only and nothing in cache', async () => {
      const client = setup();
      await loginWithRedirect(client, undefined, {
        token: {
          response: {expiresIn: 70, accessToken: null},
        },
      });

      mockFetch.mockReset();

      const token = await getTokenSilently(client, {cacheMode: 'cache-only'});

      expect(token).toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('refreshes the token when expiresIn < constant leeway & refresh tokens are used', async () => {
      const client = setup();

      await loginWithRedirect(client, undefined, {
        token: {
          response: {expiresIn: 50},
        },
      });

      mockFetch.mockReset();

      await getTokenSilently(client);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
