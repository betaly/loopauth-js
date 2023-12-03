'use server';

import {GetContextOptions, InteractionMode} from '@loopauth/auth-node';
import {NodeClient} from '@loopauth/auth-node/edge';

import {NextBaseClient, NextClientOptions} from './client';
import {CookieCache} from './cookie-cache';

export * from './types';
export {InteractionMode, LoopAuthContext} from '@loopauth/auth-node';

export class NextClient extends NextBaseClient {
  constructor(options: NextClientOptions) {
    super(options, NodeClient);
  }

  /**
   * Init sign-in and return the url to redirect to LoopAuth.
   *
   * @param cookie the raw cookie string
   * @param redirectUri the uri (callbackUri) to redirect to after sign in
   * @param interactionMode OIDC interaction mode
   * @returns the url to redirect to and new cookie if any
   */
  async handleSignIn(
    cookie: string,
    redirectUri: string,
    interactionMode?: InteractionMode,
  ): Promise<{url: string; newCookie?: string}> {
    const {nodeClient, cache} = await this.createNodeClientFromHeaders(cookie);
    await nodeClient.loginWithRedirect({
      authorizationParams: {
        interaction_mode: interactionMode,
      },
    });

    if (!this.navigateUrl) {
      // Not expected to happen
      throw new Error('navigateUrl is not set');
    }

    return {
      url: this.navigateUrl,
      newCookie: await cache.values(),
    };
  }

  /**
   * Init sign-out and return the url to redirect to LoopAuth.
   *
   * @param cookie the raw cookie string
   * @param redirectUri the uri (postSignOutUri) to redirect to after sign out
   * @returns the url to redirect to
   */
  async handleSignOut(cookie: string, redirectUri = this.options.baseUrl): Promise<string> {
    const {nodeClient} = await this.createNodeClientFromHeaders(cookie);
    await nodeClient.logout(redirectUri);

    if (!this.navigateUrl) {
      // Not expected to happen
      throw new Error('navigateUrl is not set');
    }

    return this.navigateUrl;
  }

  /**
   * Handle sign-in callback from LoopAuth.
   *
   * @param cookie the raw cookie string
   * @param callbackUrl the uri (callbackUri) to redirect to after sign in, should match the one used in handleSignIn
   * @returns new cookie if any
   */
  async handleSignInCallback(cookie: string, callbackUrl: string): Promise<string | undefined> {
    const {nodeClient, cache} = await this.createNodeClientFromHeaders(cookie);

    await nodeClient.handleRedirectCallback(callbackUrl);
    return cache.values();
  }

  /**
   * Get LoopAuth context from cookies.
   *
   * @param cookie the raw cookie string
   * @param config additional configs of GetContextOptions
   * @returns LoopAuthContext
   */
  async getLoopAuthContext(cookie: string, config: GetContextOptions = {}) {
    const {nodeClient} = await this.createNodeClientFromHeaders(cookie);
    return nodeClient.getContext(config);
  }

  private async createNodeClientFromHeaders(cookie: string) {
    const cache = await CookieCache.create(
      {
        secret: this.options.cookieSecret,
        crypto,
      },
      cookie,
    );

    const nodeClient = super.createNodeClient(cache);

    return {nodeClient, cache};
  }
}

export default NextClient;
