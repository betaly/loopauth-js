import '../mocks/cookie-cache.server-actions.module';
import '../mocks/loopauth-node-edge.module';

import NextClient from '../../server-actions';
import {NextClientOptions} from '../../types';
import {TestAuthSettings} from '../helpers';
import {mockNodeClient} from '../mocks/loopauth-node.mock';

const OPTIONS: NextClientOptions = {
  clientId: 'client_id_value',
  domain: TestAuthSettings.DOMAIN,
  baseUrl: 'http://localhost:3000',
  cookieSecret: 'complex_password_at_least_32_characters_long',
  cookieSecure: process.env.NODE_ENV === 'production',
};

const SIGN_IN_URL = `${TestAuthSettings.DOMAIN}/${TestAuthSettings.SIGN_IN_SLOT}`;
const CALLBACK_URL = 'http://localhost:3000/callback';

describe('next/client (server actions)', () => {
  beforeAll(() => {
    // Mock edge environment
    globalThis.crypto = global.crypto;
  });

  it('creates an instance without crash', () => {
    expect(() => new NextClient(OPTIONS)).not.toThrow();
  });

  describe('handleSignIn', () => {
    it('should get redirect url and new cookie', async () => {
      const client = new NextClient(OPTIONS);
      const {url, newCookie} = await client.handleSignIn('{}', SIGN_IN_URL);
      expect(url).toEqual(SIGN_IN_URL);
      expect(newCookie).not.toBeUndefined();
    });
  });

  describe('handleSignInCallback', () => {
    it('should call nodClient.handleSignInCallback', async () => {
      const client = new NextClient(OPTIONS);
      await client.handleSignInCallback('{}', CALLBACK_URL);
      expect(mockNodeClient.handleRedirectCallback).toHaveBeenCalledWith(CALLBACK_URL);
    });
  });

  describe('handleSignOut', () => {
    it('should get redirect url', async () => {
      const client = new NextClient(OPTIONS);
      const url = await client.handleSignOut('{}');
      expect(url).toEqual(OPTIONS.baseUrl);
    });
  });

  describe('getLogtoContext', () => {
    it('should get context', async () => {
      const client = new NextClient(OPTIONS);
      const context = await client.getLoopAuthContext('{}');
      expect(context).toHaveProperty('isAuthenticated', true);
    });
  });
});
