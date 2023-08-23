import {ILoopAuthContext, LoopAuthContext, RedirectLoginOptions} from './auth-context';
import {reducer} from './reducer';
import {InitialAuthState} from './state';
import {getTokenError, hasAuthParams, loginError, switchTokenError} from './utils';
import {
  GetTokenSilentlyOptions,
  InteractionMode,
  LogoutOptions,
  RedirectLoginResult,
  SwitchTokenOptions,
  User,
  WebAuthClient,
  type WebAuthClientOptions,
} from '@loopauth/auth-browser';
import React, {type ReactNode, useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react';

/**
 * The state of the application before the user was redirected to the login page.
 */
export type AppState = {
  returnTo?: string;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export interface LoopAuthProviderOptions extends WebAuthClientOptions {
  /**
   * The child nodes your Provider has wrapped
   */
  children?: ReactNode;

  /**
   * By default this removes the code and state parameters from the url when you are redirected from the authorize page.
   * It uses `window.history` but you might want to overwrite this if you are using a custom router, like `react-router-dom`
   * See the EXAMPLES.md for more info.
   */
  onRedirectCallback?: (appState?: AppState, user?: User) => void;
  /**
   * By default, if the page url has code/state params, the SDK will treat them as LoopAuth's and attempt to exchange the
   * code for a token. In some cases the code might be for something else (another OAuth SDK perhaps). In these
   * instances you can instruct the client to ignore them eg
   *
   * ```jsx
   * <LoopAuthProvider
   *   clientId={clientId}
   *   domain={domain}
   *   skipRedirectCallback={window.location.pathname === '/stripe-oauth-callback'}
   * >
   * ```
   */
  skipRedirectCallback?: boolean;

  /**
   * Context to be used when creating the LoopAuthProvider, defaults to the internally created context.
   *
   * This allows multiple LoopAuthProviders to be nested within the same application, the context value can then be
   * passed to useLoopAuth, withLoopAuth, or withAuthenticationRequired to use that specific LoopAuthProvider to access
   * auth state and methods specifically tied to the provider that the context belongs to.
   *
   * When using multiple LoopAuthProviders in a single application you should do the following to ensure sessions are not
   * overwritten:
   *
   * * Configure a different redirect_uri for each LoopAuthProvider, and set skipRedirectCallback for each provider to ignore
   * the others redirect_uri
   * * If using localstorage for both LoopAuthProviders, ensure that the audience and scope are different for so that the key
   * used to store data is different
   *
   * For a sample on using multiple LoopAuthProviders review the [React Account Linking Sample](https://github.com/loopauth-samples/loopauth-link-accounts-sample/tree/react-variant)
   */
  context?: React.Context<ILoopAuthContext>;
}

/**
 * Replaced by the package version at build time.
 * @ignore
 */
declare const __VERSION__: string;

/**
 * @ignore
 */
const toAuthClientOptions = (opts: LoopAuthProviderOptions): WebAuthClientOptions => {
  return {
    ...opts,
    authClient: {
      name: 'auth-react',
      version: __VERSION__,
    },
  };
};

/**
 * @ignore
 */
const defaultOnRedirectCallback = (appState?: AppState): void => {
  window.history.replaceState({}, document.title, appState?.returnTo ?? window.location.pathname);
};

export const LoopAuthProvider = (options: LoopAuthProviderOptions) => {
  const {
    children,
    skipRedirectCallback,
    onRedirectCallback = defaultOnRedirectCallback,
    context = LoopAuthContext,
    ...clientOpts
  } = options;
  const [client] = useState(() => new WebAuthClient(toAuthClientOptions(clientOpts)));
  const [state, dispatch] = useReducer(reducer, InitialAuthState);
  const didInitialise = useRef(false);

  useEffect(() => {
    if (didInitialise.current) {
      return;
    }
    didInitialise.current = true;
    (async (): Promise<void> => {
      try {
        let user: User | undefined;
        if (hasAuthParams() && !skipRedirectCallback) {
          const {appState} = await client.handleRedirectCallback();
          user = await client.getUser();
          onRedirectCallback(appState, user);
        } else {
          await client.checkSession();
          user = await client.getUser();
        }
        dispatch({type: 'INITIALISED', user});
      } catch (err) {
        dispatch({type: 'ERROR', error: loginError(err)});
      }
    })();
  }, [client, onRedirectCallback, skipRedirectCallback]);

  const loginWithRedirect = useCallback(
    (opts?: RedirectLoginOptions<AppState> | InteractionMode) => {
      opts =
        typeof opts === 'string'
          ? {
              authorizationParams: {
                interaction_mode: opts,
              },
            }
          : opts;
      return client.loginWithRedirect(opts);
    },
    [client],
  );

  // const loginWithPopup = useCallback(
  //   async (
  //     options?: PopupLoginOptions,
  //     config?: PopupConfigOptions
  //   ): Promise<void> => {
  //     dispatch({ type: 'LOGIN_POPUP_STARTED' });
  //     try {
  //       await client.loginWithPopup(options, config);
  //     } catch (error) {
  //       dispatch({ type: 'ERROR', error: loginError(error) });
  //       return;
  //     }
  //     const user = await client.getUser();
  //     dispatch({ type: 'LOGIN_POPUP_COMPLETE', user });
  //   },
  //   [client]
  // );

  const logout = useCallback(
    async (opts: LogoutOptions = {}): Promise<void> => {
      await client.logout(opts);
      if (opts.openUrl || opts.openUrl === false) {
        dispatch({type: 'LOGOUT'});
      }
    },
    [client],
  );

  const getAccessTokenSilently = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (opts?: GetTokenSilentlyOptions): Promise<any> => {
      let token;
      try {
        token = await client.getTokenSilently(opts);
      } catch (e) {
        throw getTokenError(e);
      } finally {
        dispatch({
          type: 'GET_ACCESS_TOKEN_COMPLETE',
          user: await client.getUser(),
        });
      }
      return token;
    },
    [client],
  );

  const switchToken = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (opts: SwitchTokenOptions): Promise<any> => {
      let token;
      try {
        token = await client.switchToken(opts);
      } catch (e) {
        throw switchTokenError(e);
      } finally {
        dispatch({
          type: 'SWITCH_TOKEN_COMPLETE',
          user: await client.getUser(),
        });
      }
      return token;
    },
    [client],
  );

  // const getAccessTokenWithPopup = useCallback(
  //   async (
  //     opts?: GetTokenWithPopupOptions,
  //     config?: PopupConfigOptions
  //   ): Promise<string | undefined> => {
  //     let token;
  //     try {
  //       token = await client.getTokenWithPopup(opts, config);
  //     } catch (error) {
  //       throw tokenError(error);
  //     } finally {
  //       dispatch({
  //         type: 'GET_ACCESS_TOKEN_COMPLETE',
  //         user: await client.getUser(),
  //       });
  //     }
  //     return token;
  //   },
  //   [client]
  // );

  const handleRedirectCallback = useCallback(
    async (url?: string): Promise<RedirectLoginResult> => {
      try {
        return await client.handleRedirectCallback(url);
      } catch (e) {
        throw getTokenError(e);
      } finally {
        dispatch({
          type: 'HANDLE_REDIRECT_COMPLETE',
          user: await client.getUser(),
        });
      }
    },
    [client],
  );

  const contextValue = useMemo<ILoopAuthContext>(
    () => ({
      ...state,
      getAccessTokenSilently,
      switchToken,
      loginWithRedirect,
      logout,
      handleRedirectCallback,
    }),
    [state, getAccessTokenSilently, loginWithRedirect, logout, handleRedirectCallback],
  );

  // eslint-disable-next-line prettier/prettier
  return <context.Provider value={contextValue}>{children}</context.Provider>;
};
