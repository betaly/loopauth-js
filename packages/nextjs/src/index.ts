import {ResponseCookies} from '@edge-runtime/cookies';
import {InteractionMode} from '@loopauth/client';
import {GetContextOptions, NodeClient} from '@loopauth/node';
import * as crypto from 'crypto';
import {IncomingMessage, ServerResponse} from 'http';
import {GetServerSidePropsContext, GetServerSidePropsResult, type NextApiHandler} from 'next';
import {NextApiRequestCookies} from 'next/dist/server/api-utils/index';

import {NextAppState, NextBaseClient, NextClientOptions} from './client';
import {CookieCache} from './cookie-cache';

export * from './types';
export * from '@loopauth/node';

export class NextClient extends NextBaseClient {
  constructor(options: NextClientOptions) {
    super(options, NodeClient);
  }

  handleSignIn =
    ({redirectUri, interactionMode}: {redirectUri?: string; interactionMode?: InteractionMode} = {}): NextApiHandler =>
    async (request, response) => {
      const {nodeClient, cache} = await this.createNodeClientFromNextApi(request, response);
      await nodeClient.loginWithRedirect<NextAppState>({
        authorizationParams: {
          interaction_mode: interactionMode,
        },
        appState: {
          redirectUri,
        },
      });
      await cache?.save();

      if (this.navigateUrl) {
        response.redirect(this.navigateUrl);
      }
    };

  handleSignInCallback =
    (redirectTo = this.options.baseUrl): NextApiHandler =>
    async (request, response) => {
      const {nodeClient, cache} = await this.createNodeClientFromNextApi(request, response);

      if (request.url) {
        const result = await nodeClient.handleRedirectCallback<NextAppState>(`${this.options.baseUrl}${request.url}`);
        if (result?.appState?.redirectUri) {
          redirectTo = result?.appState.redirectUri;
        }
        await cache?.save();
        response.redirect(redirectTo);
      }
    };

  handleSignOut =
    (redirectUri = this.options.baseUrl): NextApiHandler =>
    async (request, response) => {
      const {nodeClient, cache} = await this.createNodeClientFromNextApi(request, response);
      await nodeClient.logout(redirectUri);

      await cache?.clear();
      await cache?.save();

      if (this.navigateUrl) {
        response.redirect(this.navigateUrl);
      }
    };

  handleUser = (options?: GetContextOptions) =>
    this.withLoopAuthApiRoute((request, response) => {
      response.json(request.user);
    }, options);

  handleAuthRoutes =
    (options?: GetContextOptions): NextApiHandler =>
    (request, response) => {
      const {action} = request.query;

      if (action === 'sign-in') {
        return this.handleSignIn()(request, response);
      }

      if (action === 'sign-up') {
        return this.handleSignIn({interactionMode: 'signUp'})(request, response);
      }

      if (action === 'sign-in-callback') {
        return this.handleSignInCallback()(request, response);
      }

      if (action === 'sign-out') {
        return this.handleSignOut()(request, response);
      }

      if (action === 'user') {
        return this.handleUser(options)(request, response);
      }

      response.status(404).end();
    };

  withLoopAuthApiRoute =
    (handler: NextApiHandler, config: GetContextOptions = {}): NextApiHandler =>
    async (request, response) => {
      const {nodeClient} = await this.createNodeClientFromNextApi(request, response);
      const user = await nodeClient.getContext(config);

      Object.defineProperty(request, 'user', {enumerable: true, get: () => user});

      return handler(request, response);
    };

  withLoopAuthSsr =
    <P extends Record<string, unknown> = Record<string, unknown>>(
      handler: (
        context: GetServerSidePropsContext,
      ) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>,
      options: GetContextOptions = {},
    ) =>
    async (context: GetServerSidePropsContext) => {
      const {nodeClient} = await this.createNodeClientFromNextApi(context.req, context.res);
      const user = await nodeClient.getContext(options);

      Object.defineProperty(context.req, 'user', {enumerable: true, get: () => user});

      return handler(context);
    };

  protected async createNodeClientFromNextApi(
    request: IncomingMessage & {
      cookies: NextApiRequestCookies;
    },
    response: ServerResponse,
  ) {
    const cookieName = `loopauth:${this.options.clientId}`;
    const cache = await CookieCache.create(
      {
        secret: this.options.cookieSecret,
        crypto: crypto as Crypto,
      },
      request.cookies[cookieName] ?? '',
      value => {
        const headers = new Headers();
        const responseCookies = new ResponseCookies(headers);
        responseCookies.set(cookieName, value, {
          maxAge: 14 * 3600 * 24,
          secure: this.options.cookieSecure,
          path: '/',
        });
        headers.forEach((val, name) => response.setHeader(name, val));

        // const secure = this.options.cookieSecure;
        // const maxAge = 14 * 3600 * 24;
        // response.setHeader(
        //   'Set-Cookie',
        //   `${cookieName}=${value}; Path=/; Max-Age=${maxAge}; ${secure ? 'Secure; SameSite=None' : ''}`,
        // );
      },
    );
    const nodeClient = this.createNodeClient(cache);
    return {nodeClient, cache};
  }
}

export default NextClient;
