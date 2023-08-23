import {AuthClientOptions, AuthorizationParams, AuthorizeOptions} from './types';

/**
 * @ignore
 */
export const GET_TOKEN_SILENTLY_LOCK_KEY = 'loopauth.lock.getTokenSilently';

export const getAuthorizeParams = (
  clientOptions: AuthClientOptions & {
    authorizationParams: AuthorizationParams;
  },
  authorizationParams: AuthorizationParams,
  timestamp: number,
  client_challenge: string,
  // redirect_uri: string | undefined,
): AuthorizeOptions => {
  return {
    client_id: clientOptions.clientId,
    ...clientOptions.authorizationParams,
    ...authorizationParams,
    ts: timestamp,
    // redirect_uri: redirect_uri || clientOptions.authorizationParams.redirect_uri,
    client_challenge,
    client_challenge_method: 'S256',
  };
};
