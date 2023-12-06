import {
  GetTokenSilentlyOptions,
  GetTokenSilentlyVerboseResponse,
  InteractionMode,
  LogoutOptions as SPALogoutOptions,
  RedirectLoginOptions as SPARedirectLoginOptions,
  RedirectLoginResult,
  SwitchTokenOptions,
  TokenEndpointResponse,
  User,
} from '@loopauth/browser';
import {createContext} from 'react';

import {AppState} from './auth-provider';
import {AuthState, InitialAuthState} from './state';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LogoutOptions extends Omit<SPALogoutOptions, 'onRedirect'> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RedirectLoginOptions<TAppState = AppState>
  extends Omit<SPARedirectLoginOptions<TAppState>, 'onRedirect'> {}

export interface ILoopAuthContext<TUser extends User = User> extends AuthState<TUser> {
  /**
   * ```js
   * const token = await getAccessTokenSilently(options);
   * ```
   *
   * If there's a valid token stored, return it. Otherwise, opens an
   * iframe with the `/authorize` URL using the parameters provided
   * as arguments. Random and secure `state` and `nonce` parameters
   * will be auto-generated. If the response is successful, results
   * will be valid according to their expiration times.
   *
   * If refresh tokens are used, the token endpoint is called directly with the
   * 'refresh_token' grant. If no refresh token is available to make this call,
   * the SDK falls back to using an iframe to the '/authorize' URL.
   *
   * This method may use a web worker to perform the token call if the in-memory
   * cache is used.
   */
  getAccessTokenSilently: {
    (options: GetTokenSilentlyOptions & {detailedResponse: true}): Promise<GetTokenSilentlyVerboseResponse>;
    (options?: GetTokenSilentlyOptions): Promise<string>;
    (options: GetTokenSilentlyOptions): Promise<GetTokenSilentlyVerboseResponse | string>;
  };

  /**
   * ```js
   * const token = await getTokenWithPopup(options, config);
   * ```
   *
   * Get an access token interactively.
   *
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   */
  // getAccessTokenWithPopup: () => Promise<string | undefined>;

  /**
   *
   * @param options
   */
  switchToken: (options: SwitchTokenOptions) => Promise<TokenEndpointResponse>;

  /**
   * ```js
   * await loginWithRedirect(options);
   * ```
   *
   * Performs a redirect to `/authorize` using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated.
   */
  loginWithRedirect: (options?: RedirectLoginOptions<AppState> | InteractionMode) => Promise<void>;

  /**
   * ```js
   * client.logout({ logoutParams: { returnTo: window.location.origin } });
   * ```
   *
   * Clears the application session and performs a redirect to `/v2/logout`, using
   * the parameters provided as arguments, to clear the LoopAuth session.
   * If the `logoutParams.federated` option is specified, it also clears the Identity Provider session.
   */
  logout: (options?: LogoutOptions) => Promise<void>;

  /**
   * After the browser redirects back to the callback page,
   * call `handleRedirectCallback` to handle success and error
   * responses from LoopAuth. If the response is successful, results
   * will be valid according to their expiration times.
   *
   * @param url The URL to that should be used to retrieve the `state` and `code` values. Defaults to `window.location.href` if not given.
   */
  handleRedirectCallback: (url?: string) => Promise<RedirectLoginResult>;
}

const stub = (): never => {
  throw new Error('You forgot to wrap your component in <LoopAuthProvider>.');
};

/**
 * @ignore
 */
export const InitialContext: ILoopAuthContext = {
  ...InitialAuthState,
  getAccessTokenSilently: stub,
  switchToken: stub,
  loginWithRedirect: stub,
  logout: stub,
  handleRedirectCallback: stub,
};

export const LoopAuthContext = createContext<ILoopAuthContext>(InitialContext);
