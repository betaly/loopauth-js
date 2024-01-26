import '../mocks/cookie-cache.module';
import '../mocks/loopauth-node.module';

import * as crypto from 'crypto';
import {NextApiResponse} from 'next';
import {testApiHandler} from 'next-test-api-route-handler';

import NextClient from '../../index';
import {NextClientOptions} from '../../types';
import {TestAuthSettings} from '../helpers';
import {mockCache} from '../mocks/cookie-cache.mock';
import {mockNodeClient} from '../mocks/loopauth-node.mock';

// jest.mock('../../cookie-cache', () => MockCookieCacheModule);

const OPTIONS: NextClientOptions = {
  clientId: 'client_id_value',
  domain: TestAuthSettings.DOMAIN,
  baseUrl: 'http://localhost:3000',
  cookieSecret: 'complex_password_at_least_32_characters_long',
  cookieSecure: process.env.NODE_ENV === 'production',
};

export const SIGN_IN_URL = `${TestAuthSettings.DOMAIN}/${TestAuthSettings.SIGN_IN_SLOT}`;

const mockResponse = (_: unknown, response: NextApiResponse) => {
  response.status(200).end();
};

describe('next/client', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create an instance without crash', async () => {
    expect(() => new NextClient(OPTIONS)).not.toThrow();
  });

  it('should mock cache', async () => {
    const {CookieCache} = await import('../../cookie-cache');
    const cache = await CookieCache.create(
      {
        secret: OPTIONS.cookieSecret,
        crypto: crypto as Crypto,
      },
      'cookie',
    );
    expect(cache.allKeys).toBe(mockCache.allKeys);
  });

  describe('handleSignIn', () => {
    it('should redirect to LoopAuth sign in url and save session', async () => {
      const client = new NextClient(OPTIONS);
      await testApiHandler({
        pagesHandler: client.handleSignIn(),
        url: '/api/auth/sign-in',
        test: async ({fetch}) => {
          const response = await fetch({method: 'GET', redirect: 'manual'});
          expect(response.headers.get('location')).toEqual(SIGN_IN_URL);
        },
      });
      expect(mockCache.save).toHaveBeenCalled();
      expect(mockNodeClient.loginWithRedirect).toHaveBeenCalled();
    });

    it('should redirect to LoopAuth sign in url with interactionMode and save session', async () => {
      const client = new NextClient(OPTIONS);
      await testApiHandler({
        pagesHandler: client.handleSignIn({interactionMode: 'signUp'}),
        url: '/api/auth/sign-in',
        test: async ({fetch}) => {
          const response = await fetch({method: 'GET', redirect: 'manual'});
          expect(response.headers.get('location')).toEqual(`${SIGN_IN_URL}?interactionMode=signUp`);
        },
      });
      expect(mockCache.save).toHaveBeenCalled();
      expect(mockNodeClient.loginWithRedirect).toHaveBeenCalled();
    });
  });

  describe('handleSignInCallback', () => {
    it('should call client.handleSignInCallback and redirect to home', async () => {
      const client = new NextClient(OPTIONS);
      await testApiHandler({
        pagesHandler: client.handleSignInCallback(),
        url: '/api/auth/sign-in-callback',
        test: async ({fetch}) => {
          const response = await fetch({method: 'GET', redirect: 'manual'});
          expect(response.headers.get('location')).toEqual(`${OPTIONS.baseUrl}/`);
        },
      });
      expect(mockNodeClient.handleRedirectCallback).toHaveBeenCalled();
      expect(mockCache.save).toHaveBeenCalled();
    });
  });

  describe('withLoopAuthApiRoute', () => {
    it('should assign `user` to `request`', async () => {
      const client = new NextClient(OPTIONS);
      await testApiHandler({
        pagesHandler: client.withLoopAuthApiRoute((request, response) => {
          expect(request.user).toBeDefined();
          response.end();
        }),
        test: async ({fetch}) => {
          await fetch({method: 'GET', redirect: 'manual'});
        },
      });
      expect(mockNodeClient.getContext).toHaveBeenCalled();
    });
  });

  describe('handleSignOut', () => {
    it('should redirect to LoopAuth sign out url', async () => {
      const client = new NextClient(OPTIONS);
      await testApiHandler({
        pagesHandler: client.handleSignOut(),
        url: '/api/auth/sign-out',
        test: async ({fetch}) => {
          const response = await fetch({method: 'GET', redirect: 'manual'});
          expect(response.headers.get('location')).toEqual(`${OPTIONS.baseUrl}/`);
        },
      });
      expect(mockCache.save).toHaveBeenCalled();
      expect(mockNodeClient.logout).toHaveBeenCalled();
    });
  });

  describe('handleAuthRoutes', () => {
    it('should call handleSignIn for "sign-in"', async () => {
      const client = new NextClient(OPTIONS);
      jest.spyOn(client, 'handleSignIn').mockImplementation(() => mockResponse);
      await testApiHandler({
        pagesHandler: client.handleAuthRoutes(),
        paramsPatcher: parameters => {
          parameters.action = 'sign-in';
        },
        test: async ({fetch}) => {
          await fetch({method: 'GET', redirect: 'manual'});
          expect(client.handleSignIn).toHaveBeenCalled();
        },
      });
    });

    it('should call handleSignIn for "sign-up"', async () => {
      const client = new NextClient(OPTIONS);
      jest.spyOn(client, 'handleSignIn').mockImplementation(() => mockResponse);
      await testApiHandler({
        pagesHandler: client.handleAuthRoutes(),
        paramsPatcher: parameters => {
          parameters.action = 'sign-up';
        },
        test: async ({fetch}) => {
          await fetch({method: 'GET', redirect: 'manual'});
          expect(client.handleSignIn).toHaveBeenCalledWith({interactionMode: 'signUp'});
        },
      });
    });

    it('should call handleSignInCallback for "sign-in-callback"', async () => {
      const client = new NextClient(OPTIONS);
      jest.spyOn(client, 'handleSignInCallback').mockImplementation(() => mockResponse);
      await testApiHandler({
        pagesHandler: client.handleAuthRoutes(),
        paramsPatcher: parameters => {
          parameters.action = 'sign-in-callback';
        },
        test: async ({fetch}) => {
          await fetch({method: 'GET', redirect: 'manual'});
          expect(client.handleSignInCallback).toHaveBeenCalled();
        },
      });
    });

    it('should call handleSignOut for "sign-out"', async () => {
      const client = new NextClient(OPTIONS);
      jest.spyOn(client, 'handleSignOut').mockImplementation(() => mockResponse);
      await testApiHandler({
        pagesHandler: client.handleAuthRoutes(),
        paramsPatcher: parameters => {
          parameters.action = 'sign-out';
        },
        test: async ({fetch}) => {
          await fetch({method: 'GET', redirect: 'manual'});
          expect(client.handleSignOut).toHaveBeenCalled();
        },
      });
    });

    it('should call handleUser for "user"', async () => {
      const client = new NextClient(OPTIONS);
      jest.spyOn(client, 'handleUser').mockImplementation(() => mockResponse);
      await testApiHandler({
        pagesHandler: client.handleAuthRoutes(),
        paramsPatcher: parameters => {
          parameters.action = 'user';
        },
        test: async ({fetch}) => {
          await fetch({method: 'GET', redirect: 'manual'});
          expect(client.handleUser).toHaveBeenCalled();
        },
      });
    });
  });
});
