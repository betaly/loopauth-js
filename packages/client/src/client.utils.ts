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
  state: string,
  timestamp: number,
  client_challenge: string,
  redirect_uri: string | undefined,
  response_mode: string | undefined,
): AuthorizeOptions => {
  return {
    client_id: clientOptions.clientId,
    ...clientOptions.authorizationParams,
    ...authorizationParams,
    response_type: 'code',
    response_mode: response_mode || 'query',
    state,
    ts: timestamp,
    redirect_uri: redirect_uri || clientOptions.authorizationParams.redirect_uri,
    client_challenge,
    client_challenge_method: 'S256',
  };
};
