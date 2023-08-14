import {expect} from '@jest/globals';

import {urlSafeBase64} from '../../../base64';
import {DEFAULT_AUTH_CLIENT} from '../../../constants';
import * as fetches from '../../../fetch';
import * as utils from '../../../utils';
import {TEST_ACCESS_TOKEN, TEST_CLIENT_CHALLENGE, TEST_CLIENT_ID, TEST_CODE, TEST_REFRESH_TOKEN} from '../../constants';
// @ts-ignore
import {assertPostFn, fetchResponse, loginWithRedirectFn, prepareClientMocks} from './helpers';

jest.mock('../../../tokens');

jest.spyOn(utils, 'stringToBase64UrlEncoded').mockReturnValue(TEST_CLIENT_CHALLENGE);

jest.spyOn(fetches, 'switchFetch');

describe('AuthClient', () => {
  const {setup, mockWindow, mockFetch} = prepareClientMocks();
  const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

  describe('handleRedirectCallback', () => {
    it('should throw an error if the /authorize call redirects with no params', async () => {
      const client = setup();
      let error;
      try {
        await loginWithRedirect(
          client,
          {},
          {
            authorize: {
              error: undefined,
              code: undefined,
            },
          },
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('There are no query params available for parsing.');
    });

    it('uses the custom http timeout value if specified', async () => {
      const client = setup({httpTimeoutInSeconds: 40});
      const result = await loginWithRedirect(client, {});

      expect((fetches.switchFetch as jest.Mock).mock.calls[0][1]).toMatchObject({timeout: 40000});
      expect(result).toBeDefined();
    });

    it('calls auth/token when not using useFormData', async () => {
      window.history.pushState({}, 'Test', `#/callback/?code=${TEST_CODE}`);

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          refreshToken: TEST_REFRESH_TOKEN,
          accessToken: TEST_ACCESS_TOKEN,
          expiresIn: 86400,
        }),
      );

      const client = setup({
        useFormData: false,
      });
      delete client['options']['authorizationParams']?.['redirect_uri'];

      await loginWithRedirect(client);

      expect(mockFetch.mock.calls[0][0]).toBe('https://auth_domain/auth/token');

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.redirect_uri).toBeUndefined();
    });

    it('calls oauth/token when using useFormData', async () => {
      window.history.pushState({}, 'Test', `#/callback/?code=${TEST_CODE}`);

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          refreshToken: TEST_REFRESH_TOKEN,
          accessToken: TEST_ACCESS_TOKEN,
          expiresIn: 86400,
        }),
      );

      const client = setup({
        useFormData: true,
      });
      delete client['options']['authorizationParams']?.['redirect_uri'];

      await loginWithRedirect(client);

      assertPostFn(mockFetch)(
        'https://auth_domain/auth/token',
        {
          redirect_uri: undefined,
          clientId: TEST_CLIENT_ID,
          code: TEST_CODE,
        },
        {
          'LoopAuth-Client': urlSafeBase64.encode(JSON.stringify(DEFAULT_AUTH_CLIENT)),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        0,
        false,
      );
    });

    describe('when there is a valid query string in a hash', () => {
      it('should throw an error if the /authorize call redirects with an error param', async () => {
        const client = setup();
        let error;
        try {
          await loginWithRedirect(
            client,
            {},
            {
              authorize: {
                error: 'some-error',
                errorDescription: 'some-error-description',
              },
              useHash: true,
            },
          );
        } catch (e) {
          error = e;
        }
        expect(error).toBeDefined();
        expect(error.error).toBe('some-error');
        expect(error.error_description).toBe('some-error-description');
      });

      // it('should clear the transaction data when the /authorize call redirects with a code param', async () => {
      //   const client = setup();
      //
      //   jest.spyOn(client['transactionManager'], 'remove');
      //   await loginWithRedirect(
      //     client,
      //     {},
      //     {
      //       useHash: true,
      //     },
      //   );
      //
      //   expect(client['transactionManager'].remove).toHaveBeenCalled();
      // });
      //
      // it('should clear the transaction data when the /authorize call redirects with an error param', async () => {
      //   const client = setup();
      //   let error;
      //   jest.spyOn(client['transactionManager'], 'remove');
      //
      //   try {
      //     await loginWithRedirect(
      //       client,
      //       {},
      //       {
      //         authorize: {
      //           error: 'some-error',
      //         },
      //         useHash: true,
      //       },
      //     );
      //   } catch (e) {
      //     error = e;
      //   }
      //
      //   expect(error).toBeDefined();
      //   expect(client['transactionManager'].remove).toHaveBeenCalled();
      // });
      //
      it('should throw an error if the /authorize call redirects with no params', async () => {
        const client = setup();
        let error;
        try {
          await loginWithRedirect(
            client,
            {},
            {
              authorize: {
                code: undefined,
              },
              useHash: true,
            },
          );
        } catch (e) {
          error = e;
        }
        expect(error).toBeDefined();
        expect(error.message).toBe('There are no query params available for parsing.');
      });
    });
  });
});
