import {AuthClientOptions, RedirectLoginOptions} from '@loopauth/client';

import {TestAuthSettings} from '../helpers';
import {mockNodeClient} from './loopauth-node.mock';

jest.mock('@loopauth/node', () => ({
  NodeClient: jest.fn((opts: AuthClientOptions) => {
    const {domain} = opts;
    const signInUrl = `${domain}/${TestAuthSettings.SIGN_IN_SLOT}`;
    return {
      ...mockNodeClient,
      loginWithRedirect: async (options: RedirectLoginOptions = {}) => {
        const openUrl = options.openUrl ?? opts.openUrl;
        const interactionMode = options.authorizationParams?.interaction_mode;
        await openUrl?.(interactionMode ? `${signInUrl}?interactionMode=${interactionMode}` : `${signInUrl}`);
        await mockNodeClient.loginWithRedirect?.(options);
      },
      logout: async (redirectUri?: string) => {
        if (redirectUri) await opts.openUrl?.(redirectUri);
        await mockNodeClient.logout?.(redirectUri);
      },
    };
  }),
}));
