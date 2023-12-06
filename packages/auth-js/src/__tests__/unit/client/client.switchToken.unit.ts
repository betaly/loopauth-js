// @ts-ignore
import {acquireLockSpy} from 'browser-tabs-lock';
import UrlSafer from 'urlsafer';

import {DEFAULT_AUTH_CLIENT} from '../../../constants';
import * as fetches from '../../../fetch';
import * as utils from '../../../utils';
import {TEST_ACCESS_TOKEN, TEST_CLIENT_CHALLENGE, TEST_REFRESH_TOKEN, TEST_TENANT_ID} from '../../constants';
import {assertPostFn, loginWithRedirectFn, prepareClientMocks, switchTokenFn} from './helpers';

jest.mock('../../../tokens');

jest.spyOn(utils, 'stringToBase64UrlEncoded').mockReturnValue(TEST_CLIENT_CHALLENGE);
jest.spyOn(fetches, 'switchFetch');

describe('AuthClient', () => {
  const {setup, mockWindow, mockFetch} = prepareClientMocks();
  const assertPost = assertPostFn(mockFetch);
  const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);
  const switchToken = switchTokenFn(mockWindow, mockFetch);

  afterEach(() => {
    acquireLockSpy.mockResolvedValue(true);
  });

  describe('switchToken', () => {
    it('calls switch token endpoint with the correct params when using refresh tokens and not using useFormData', async () => {
      const client = setup({
        useFormData: false,
      });

      await loginWithRedirect(client);

      mockFetch.mockReset();

      await switchToken(client);

      assertPost(
        'https://auth_domain/auth/token-switch',
        {
          tenantId: TEST_TENANT_ID,
          refreshToken: TEST_REFRESH_TOKEN,
        },
        {
          'LoopAuth-Client': UrlSafer.encode(JSON.stringify(DEFAULT_AUTH_CLIENT)),
        },
      );
    });

    it('calls switch token endpoint with the correct params when using refresh tokens and using useFormData', async () => {
      const client = setup({
        useFormData: true,
      });

      await loginWithRedirect(client);

      mockFetch.mockReset();

      await switchToken(client);

      assertPost(
        'https://auth_domain/auth/token-switch',
        {
          tenantId: TEST_TENANT_ID,
          refreshToken: TEST_REFRESH_TOKEN,
        },
        {
          'LoopAuth-Client': UrlSafer.encode(JSON.stringify(DEFAULT_AUTH_CLIENT)),
        },
        undefined,
        false,
      );
    });

    it('should switch token', async () => {
      const client = setup();
      await loginWithRedirect(client, undefined, {
        token: {
          response: {expiresIn: 70, access_token: TEST_ACCESS_TOKEN},
        },
      });

      mockFetch.mockReset();

      const token = await switchToken(client);

      expect(token.accessToken).toBe(TEST_ACCESS_TOKEN);
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
