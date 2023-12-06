import {AuthClient, AuthClientOptions} from '@loopauth/client';

import {LoopAuthContext} from './types';

export type GetContextOptions = {
  withAccessToken?: boolean;
};

export class LoopAuthNodeBaseClient<Options extends AuthClientOptions = AuthClientOptions> extends AuthClient<Options> {
  async getContext({withAccessToken}: GetContextOptions = {}) {
    const context: LoopAuthContext = {
      isAuthenticated: await this.isAuthenticated(),
    };

    if (!context.isAuthenticated) {
      return context;
    }

    if (withAccessToken) {
      try {
        context.accessToken = await this.getTokenSilently();
      } catch (error) {
        return {
          isAuthenticated: false,
        };
      }
    }

    context.user = await this.getUser();

    return context;
  }
}
