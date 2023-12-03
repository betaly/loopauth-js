import {InteractionMode} from '@loopauth/auth-js';
import {GetContextOptions, NodeClient} from '@loopauth/auth-node';
import * as crypto from 'crypto';
import {IncomingMessage, ServerResponse} from 'http';
import {GetServerSidePropsContext, GetServerSidePropsResult, type NextApiHandler} from 'next';
import {type NextApiRequestCookies} from 'next/dist/server/api-utils/index';

import {NextBaseClient, NextClientOptions} from './client';
import {CookieCache} from './cookie-cache';

export * from '@loopauth/auth-node';

export class NextClient extends NextBaseClient {
  constructor(options: NextClientOptions) {
    super(options, NodeClient);
  }

  handleSignIn =
    (interactionMode?: InteractionMode): NextApiHandler =>
    async (request, response) => {
      const nodeClient = await this.createNodeClientFromNextApi(request, response);
      await nodeClient.loginWithRedirect({
        authorizationParams: {
          interaction_mode: interactionMode,
        },
      });
      await this.cache?.save();

      if (this.navigateUrl) {
        response.redirect(this.navigateUrl);
      }
    };

  handleSignInCallback =
    (redirectTo = this.options.baseUrl): NextApiHandler =>
    async (request, response) => {
      const nodeClient = await this.createNodeClientFromNextApi(request, response);

      if (request.url) {
        await nodeClient.handleRedirectCallback(`${this.options.baseUrl}${request.url}`);
        await this.cache?.save();
        response.redirect(redirectTo);
      }
    };

  handleSignOut =
    (redirectUri = this.options.baseUrl): NextApiHandler =>
    async (request, response) => {
      const nodeClient = await this.createNodeClientFromNextApi(request, response);
      await nodeClient.logout(redirectUri);

      await this.cache?.clear();
      await this.cache?.save();

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
        return this.handleSignIn('signUp')(request, response);
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
      const nodeClient = await this.createNodeClientFromNextApi(request, response);
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
      const nodeClient = await this.createNodeClientFromNextApi(context.req, context.res);
      const user = await nodeClient.getContext(options);

      Object.defineProperty(context.req, 'user', {enumerable: true, get: () => user});

      return handler(context);
    };

  protected async createNodeClientFromNextApi(
    request: IncomingMessage & {
      cookies: NextApiRequestCookies;
    },
    response: ServerResponse,
  ): Promise<NodeClient> {
    const cookieName = `loopauth:${this.options.clientId}`;

    return this.createNodeClient(
      await CookieCache.create(
        {
          secret: this.options.cookieSecret,
          crypto: crypto as Crypto,
        },
        request.cookies[cookieName] ?? '',
        value => {
          const secure = this.options.cookieSecure;
          const maxAge = 14 * 3600 * 24;
          response.setHeader(
            'Set-Cookie',
            `${cookieName}=${value}; Path=/; Max-Age=${maxAge}; ${secure ? 'Secure; SameSite=None' : ''}`,
          );
        },
      ),
    );
  }
}

export default NextClient;
