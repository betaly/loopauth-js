import {expect} from '@jest/globals';

import * as utils from '../../../utils';
import {TEST_CLIENT_CHALLENGE} from '../../constants';
import {loginWithRedirectFn, prepareClientMocks} from './helpers';

jest.mock('../../../tokens');

jest.spyOn(utils, 'stringToBase64UrlEncoded').mockReturnValue(TEST_CLIENT_CHALLENGE);

describe('AuthClient', () => {
  const {setup, mockWindow, mockFetch} = prepareClientMocks();
  const loginWithRedirect = loginWithRedirectFn(mockWindow, mockFetch);

  describe('isAuthenticated', () => {
    describe('loginWithRedirect', () => {
      it('returns true if there is a user', async () => {
        const client = setup();
        await loginWithRedirect(client);

        const result = await client.isAuthenticated();
        expect(result).toBe(true);
      });

      it('returns false if error was returned', async () => {
        const client = setup();

        try {
          await loginWithRedirect(client, undefined, {
            authorize: {
              error: 'some-error',
            },
          });
        } catch {
          /* empty */
        }

        const result = await client.isAuthenticated();

        expect(result).toBe(false);
      });

      it('returns false if token call fails', async () => {
        const client = setup();
        try {
          await loginWithRedirect(client, undefined, {
            token: {success: false},
          });
        } catch (error) {
          // no-op
        }
        const result = await client.isAuthenticated();
        expect(result).toBe(false);
      });
    });

    it('returns false if there is no user', async () => {
      const client = setup();
      const result = await client.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
