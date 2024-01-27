import {InteractionMode} from '@loopauth/client';
import {GetContextOptions, NodeClient} from '@loopauth/node';
import {RequestCookies, ResponseCookies} from 'next/dist/compiled/@edge-runtime/cookies';
import {NextRequest} from 'next/server';

import {NextAppState, NextBaseClient, NextClientOptions} from './client';
import {chunkCookieToResponseCookies, SessionStore} from './cookie';
import {CookieCache} from './cookie-cache';

export * from './types';
export {InteractionMode, LoopAuthContext} from '@loopauth/node';

export class NextClient extends NextBaseClient {
  constructor(options: NextClientOptions) {
    super(options, NodeClient);
  }

  handleSignIn =
    ({redirectUri, interactionMode}: {redirectUri?: string; interactionMode?: InteractionMode} = {}) =>
    async (request: Request) => {
      const {nodeClient, headers, cache} = await this.createNodeClientFromEdgeRequest(request);
      await nodeClient.loginWithRedirect<NextAppState>({
        /*redirectUri, */ authorizationParams: {
          interaction_mode: interactionMode,
        },
        appState: {
          redirectUri,
        },
      });
      await cache?.save();

      const response = new Response(null, {
        headers,
        status: 307,
      });

      if (this.navigateUrl) {
        response.headers.append('Location', this.navigateUrl);
      }

      return response;
    };

  handleSignOut =
    (redirectUri = this.options.baseUrl) =>
    async (request: NextRequest) => {
      const {nodeClient, headers, cache} = await this.createNodeClientFromEdgeRequest(request);
      await nodeClient.logout(redirectUri);
      await cache?.clear();
      await cache?.save();

      const response = new Response(null, {
        headers,
        status: 307,
      });

      if (this.navigateUrl) {
        response.headers.append('Location', this.navigateUrl);
      }

      return response;
    };

  handleSignInCallback =
    (redirectTo = this.options.baseUrl) =>
    async (request: NextRequest) => {
      const {nodeClient, headers, cache} = await this.createNodeClientFromEdgeRequest(request);

      if (request.url) {
        // When app is running behind reverse proxy which is common for edge runtime,
        // the `request.url`'s domain may not be expected, replace to the configured baseUrl
        const requestUrl = new URL(request.url);
        const callbackUrl = new URL(
          `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`,
          this.options.baseUrl,
        );
        const result = await nodeClient.handleRedirectCallback<NextAppState>(callbackUrl.toString());
        if (result?.appState?.redirectUri) {
          redirectTo = result?.appState.redirectUri;
        }
        await cache?.save();
      }

      const response = new Response(null, {
        status: 307,
        headers,
      });
      response.headers.append('Location', redirectTo);
      return response;
    };

  handleUser = (options?: GetContextOptions) => async (request: NextRequest) => {
    const context = await this.getLoopAuthContext(request, options);
    return new Response(JSON.stringify(context), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  };

  getLoopAuthContext = async (request: NextRequest, options: GetContextOptions = {}) => {
    const {nodeClient} = await this.createNodeClientFromEdgeRequest(request);
    return nodeClient.getContext(options);
  };

  protected async createNodeClientFromEdgeRequest(request: Request) {
    const cookieName = `loopauth:${this.options.clientId}`;
    const requestCookies = new RequestCookies(request.headers);
    const requestSessionStore = new SessionStore(cookieName, requestCookies);

    const headers = new Headers();
    const responseCookies = new ResponseCookies(headers);
    const cache = await CookieCache.create(
      {
        secret: this.options.cookieSecret,
        crypto,
      },
      requestSessionStore.value,
      value => {
        chunkCookieToResponseCookies(
          cookieName,
          value,
          {
            maxAge: 14 * 3600 * 24,
            secure: this.options.cookieSecure,
          },
          responseCookies,
          requestCookies,
        );
      },
    );
    const nodeClient = super.createNodeClient(cache);

    return {nodeClient, headers, cache};
  }
}

export default NextClient;
