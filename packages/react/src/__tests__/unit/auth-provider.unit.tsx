import '@testing-library/jest-dom';

import {GetTokenSilentlyVerboseResponse, TokenEndpointResponse, WebAuthClient} from '@loopauth/browser';
import {act, render, renderHook, screen, waitFor} from '@testing-library/react';
import React, {StrictMode, useContext} from 'react';

import {ILoopAuthContext, InitialContext, LoopAuthContext} from '../../auth-context';
import {LoopAuthProvider} from '../../auth-provider';
import {useLoopAuth} from '../../hooks';
import {createWrapper} from '../helpers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../../package.json');

const clientMock = jest.mocked(new WebAuthClient({clientId: '', domain: ''}));

const TEST_TOKEN_RESPONSE: TokenEndpointResponse = {
  accessToken: '__test_access_token__',
  refreshToken: '__test_refresh_token__',
  expiresIn: 3600,
};

describe('LoopAuthProvider', () => {
  afterEach(() => {
    window.history.pushState({}, document.title, '/');
  });

  it('should provide the LoopAuthProvider result', async () => {
    const wrapper = createWrapper();
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    // expect(result.current).toBeDefined();
    await waitFor(() => expect(result.current).toBeDefined());
  });

  it('should configure an instance of the AuthClient', async () => {
    const opts = {
      clientId: 'foo',
      domain: 'bar',
      authorizationParams: {
        redirect_uri: 'baz',
        max_age: 'qux',
        extra_param: '__test_extra_param__',
      },
    };
    const wrapper = createWrapper(opts);

    await act(async () => {
      renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
    });

    expect(WebAuthClient).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'foo',
        domain: 'bar',
        authorizationParams: {
          redirect_uri: 'baz',
          max_age: 'qux',
          extra_param: '__test_extra_param__',
        },
      }),
    );
  });

  it('should pass user agent to AuthClient', async () => {
    const opts = {
      clientId: 'foo',
      domain: 'bar',
    };
    const wrapper = createWrapper(opts);
    await act(async () => {
      renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
    });
    expect(WebAuthClient).toHaveBeenCalledWith(
      expect.objectContaining({
        authClient: {
          name: 'auth-react',
          version: pkg.version,
        },
      }),
    );
  });

  it('should check session when logged out', async () => {
    const wrapper = createWrapper();
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(clientMock.checkSession).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should check session when logged in', async () => {
    const user = {id: '__test_user__'};
    clientMock.getUser.mockResolvedValue(user);
    const wrapper = createWrapper();
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user).toBe(user);
    expect(clientMock.checkSession).toHaveBeenCalled();
  });

  it('should handle errors when checking session', async () => {
    clientMock.checkSession.mockRejectedValueOnce({
      error: '__test_error__',
      error_description: '__test_error_description__',
    });
    const wrapper = createWrapper();
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(clientMock.checkSession).toHaveBeenCalled());
    expect(() => {
      throw result.current.error;
    }).toThrowError('__test_error_description__');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle redirect callback success and clear the url', async () => {
    window.history.pushState({}, document.title, '/?code=__test_code__&state=__test_state__');
    expect(window.location.href).toBe('https://www.example.com/?code=__test_code__&state=__test_state__');
    clientMock.handleRedirectCallback.mockResolvedValueOnce({
      appState: undefined,
    });
    const wrapper = createWrapper();
    renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(clientMock.handleRedirectCallback).toHaveBeenCalled());
    expect(window.location.href).toBe('https://www.example.com/');
  });

  it('should handle redirect callback success and return to app state param', async () => {
    window.history.pushState({}, document.title, '/?code=__test_code__&state=__test_state__');
    expect(window.location.href).toBe('https://www.example.com/?code=__test_code__&state=__test_state__');
    clientMock.handleRedirectCallback.mockResolvedValueOnce({
      appState: {returnTo: '/foo'},
    });
    const wrapper = createWrapper();
    renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(clientMock.handleRedirectCallback).toHaveBeenCalled());
    expect(window.location.href).toBe('https://www.example.com/foo');
  });

  it('should handle redirect callback errors', async () => {
    window.history.pushState({}, document.title, '/?error=__test_error__&state=__test_state__');
    clientMock.handleRedirectCallback.mockRejectedValue(new Error('__test_error__'));
    const wrapper = createWrapper();
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(clientMock.handleRedirectCallback).toHaveBeenCalled());
    expect(() => {
      throw result.current.error;
    }).toThrowError('__test_error__');
  });

  it('should handle redirect and call a custom handler', async () => {
    window.history.pushState({}, document.title, '/?code=__test_code__&state=__test_state__');
    const user = {id: '__test_user__'};
    clientMock.getUser.mockResolvedValue(user);
    clientMock.handleRedirectCallback.mockResolvedValue({
      appState: {foo: 'bar'},
    });
    const onRedirectCallback = jest.fn();
    const wrapper = createWrapper({
      onRedirectCallback,
    });
    renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(onRedirectCallback).toHaveBeenCalledWith({foo: 'bar'}, user));
  });

  it('should skip redirect callback for non auth redirect callback handlers', async () => {
    clientMock.isAuthenticated.mockResolvedValue(true);
    window.history.pushState({}, document.title, '/?code=__some_non_auth_code__&state=__test_state__');
    clientMock.handleRedirectCallback.mockRejectedValue(new Error('__test_error__'));
    const wrapper = createWrapper({
      skipRedirectCallback: true,
    });
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.error).not.toBeDefined();
    expect(clientMock.handleRedirectCallback).not.toHaveBeenCalled();
  });

  it('should provide a login method', async () => {
    const wrapper = createWrapper();
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(result.current.loginWithRedirect).toBeInstanceOf(Function));
    await result.current.loginWithRedirect('signUp');
    expect(clientMock.loginWithRedirect).toHaveBeenCalledWith({
      authorizationParams: {
        interaction_mode: 'signUp',
      },
    });
  });

  it('should provide a logout method', async () => {
    const user = {id: '__test_user__'};
    clientMock.getUser.mockResolvedValue(user);
    const wrapper = createWrapper();
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(result.current.logout).toBeInstanceOf(Function));
    await act(async () => {
      await result.current.logout();
    });
    expect(clientMock.logout).toHaveBeenCalled();
    // Should not update state until returned from idp
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBe(user);
  });

  it('should update state when using openUrl', async () => {
    const user = {id: '__test_user__'};
    clientMock.getUser.mockResolvedValue(user);
    // get logout to return a Promise to simulate async cache.
    clientMock.logout.mockResolvedValue();
    const wrapper = createWrapper();
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await result.current.logout({openUrl: async () => {}});
    });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should wait for logout with async cache', async () => {
    const user = {id: '__test_user__'};
    const logoutSpy = jest.fn();
    clientMock.getUser.mockResolvedValue(user);
    // get logout to return a Promise to simulate async cache.
    clientMock.logout.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      logoutSpy();
    });
    const wrapper = createWrapper();
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    await act(async () => {
      await result.current.logout();
    });
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('should update state for openUrl false', async () => {
    const user = {id: '__test_user__'};
    clientMock.getUser.mockResolvedValue(user);
    const wrapper = createWrapper();
    const {result} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user).toBe(user);
    act(() => {
      result.current.logout({openUrl: false});
    });
    expect(clientMock.logout).toHaveBeenCalledWith({
      openUrl: false,
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(result.current.user).toBeUndefined();
  });

  describe('getAccessTokenSilently', () => {
    it('should provide a getAccessTokenSilently method', async () => {
      clientMock.getTokenSilently.mockResolvedValue('token');
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.getAccessTokenSilently).toBeInstanceOf(Function));
      await act(async () => {
        const token = await result.current.getAccessTokenSilently();
        expect(token).toBe('token');
      });

      expect(clientMock.getTokenSilently).toHaveBeenCalled();
    });

    it('should get the full token response from getAccessTokenSilently when detailedResponse is true', async () => {
      const tokenResponse: GetTokenSilentlyVerboseResponse = {
        accessToken: '123',
        expiresIn: 2,
      };
      (clientMock.getTokenSilently as jest.Mock).mockResolvedValue(tokenResponse);
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      // await waitForNextUpdate();

      await act(async () => {
        const token = await result.current.getAccessTokenSilently({
          detailedResponse: true,
        });
        expect(token).toBe(tokenResponse);
      });
      expect(clientMock.getTokenSilently).toHaveBeenCalled();
    });

    it('should normalize errors from getAccessTokenSilently method', async () => {
      clientMock.getTokenSilently.mockRejectedValue(new ProgressEvent('error'));
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      // await waitForNextUpdate();
      await act(async () => {
        await expect(result.current.getAccessTokenSilently).rejects.toThrowError('Get access token failed');
      });
    });

    it('should call getAccessTokenSilently in the scope of the LoopAuth client', async () => {
      clientMock.getTokenSilently.mockReturnThis();
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });

      await act(async () => {
        const returnedThis = await result.current.getAccessTokenSilently();
        expect(returnedThis).toStrictEqual(clientMock);
      });
    });

    it('should update auth state after getAccessTokenSilently', async () => {
      clientMock.getTokenSilently.mockReturnThis();
      clientMock.getUser.mockResolvedValue({id: 'foo'});
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.user?.id).toEqual('foo'));
      clientMock.getUser.mockResolvedValue({id: 'bar'});
      await act(async () => {
        await result.current.getAccessTokenSilently();
      });
      expect(result.current.user?.id).toEqual('bar');
    });

    it('should update auth state after getAccessTokenSilently fails', async () => {
      clientMock.getTokenSilently.mockReturnThis();
      clientMock.getUser.mockResolvedValue({id: 'foo'});
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.isAuthenticated).toBeTruthy());
      clientMock.getTokenSilently.mockRejectedValue({error: 'login_required'});
      clientMock.getUser.mockResolvedValue(undefined);
      await act(async () => {
        await expect(() => result.current.getAccessTokenSilently()).rejects.toThrowError('login_required');
      });
      expect(result.current.isAuthenticated).toBeFalsy();
    });

    it('should ignore same user after getAccessTokenSilently', async () => {
      clientMock.getTokenSilently.mockReturnThis();
      const userObject = {id: 'foo'};
      clientMock.getUser.mockResolvedValue(userObject);
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.user).toBeDefined());
      const prevUser = result.current.user;
      clientMock.getUser.mockResolvedValue(userObject);
      await act(async () => {
        await result.current.getAccessTokenSilently();
      });
      expect(result.current.user).toBe(prevUser);
    });

    it('should not update getAccessTokenSilently after auth state change', async () => {
      clientMock.getTokenSilently.mockReturnThis();
      clientMock.getUser.mockResolvedValue({id: 'foo'});
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.user).toBeDefined());
      const memoized = result.current.getAccessTokenSilently;
      expect(result.current.user?.id).toEqual('foo');
      clientMock.getUser.mockResolvedValue({id: 'bar'});
      await act(async () => {
        await result.current.getAccessTokenSilently();
      });
      expect(result.current.user?.id).toEqual('bar');
      expect(result.current.getAccessTokenSilently).toBe(memoized);
    });

    it('should handle not having a user while calling getAccessTokenSilently', async () => {
      const token = '__test_token__';
      clientMock.getTokenSilently.mockResolvedValue(token);
      clientMock.getUser.mockResolvedValue(undefined);
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      let returnedToken;
      await act(async () => {
        returnedToken = await result.current.getAccessTokenSilently();
      });
      expect(returnedToken).toBe(token);
    });
  });

  describe('switchToken', () => {
    it('should provide a switchToken method', async () => {
      clientMock.switchToken.mockResolvedValue(TEST_TOKEN_RESPONSE);
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.switchToken).toBeInstanceOf(Function));
      await act(async () => {
        const token = await result.current.switchToken({tenantId: 'foo'});
        expect(token).toBe(TEST_TOKEN_RESPONSE);
      });

      expect(clientMock.switchToken).toHaveBeenCalled();
    });

    it('should normalize errors from switchToken method', async () => {
      clientMock.switchToken.mockRejectedValue(new ProgressEvent('error'));
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      // await waitForNextUpdate();
      await act(async () => {
        await expect(result.current.switchToken).rejects.toThrowError('Switch token failed');
      });
    });

    it('should call switchToken in the scope of the LoopAuth client', async () => {
      clientMock.switchToken.mockReturnThis();
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });

      await act(async () => {
        const returnedThis = await result.current.switchToken({tenantId: 'foo'});
        expect(returnedThis).toStrictEqual(clientMock);
      });
    });

    it('should update auth state after switchToken', async () => {
      clientMock.switchToken.mockReturnThis();
      clientMock.getUser.mockResolvedValue({id: 'foo'});
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.user?.id).toEqual('foo'));
      clientMock.getUser.mockResolvedValue({id: 'bar'});
      await act(async () => {
        await result.current.switchToken({tenantId: 'foo'});
      });
      expect(result.current.user?.id).toEqual('bar');
    });

    it('should update auth state after switchToken fails', async () => {
      clientMock.switchToken.mockReturnThis();
      clientMock.getUser.mockResolvedValue({id: 'foo'});
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.isAuthenticated).toBeTruthy());
      clientMock.switchToken.mockRejectedValue({error: 'login_required'});
      clientMock.getUser.mockResolvedValue(undefined);
      await act(async () => {
        await expect(() => result.current.switchToken({tenantId: 'foo'})).rejects.toThrowError('login_required');
      });
      expect(result.current.isAuthenticated).toBeFalsy();
    });

    it('should ignore same user after switchToken', async () => {
      clientMock.switchToken.mockReturnThis();
      const userObject = {id: 'foo'};
      clientMock.getUser.mockResolvedValue(userObject);
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.user).toBeDefined());
      const prevUser = result.current.user;
      clientMock.getUser.mockResolvedValue(userObject);
      await act(async () => {
        await result.current.switchToken({tenantId: 'foo'});
      });
      expect(result.current.user).toBe(prevUser);
    });

    it('should not update switchToken after auth state change', async () => {
      clientMock.switchToken.mockReturnThis();
      clientMock.getUser.mockResolvedValue({id: 'foo'});
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.user).toBeDefined());
      const memoized = result.current.switchToken;
      expect(result.current.user?.id).toEqual('foo');
      clientMock.getUser.mockResolvedValue({id: 'bar'});
      await act(async () => {
        await result.current.switchToken({tenantId: 'foo'});
      });
      expect(result.current.user?.id).toEqual('bar');
      expect(result.current.switchToken).toBe(memoized);
    });

    it('should handle not having a user while calling switchToken', async () => {
      clientMock.switchToken.mockResolvedValue(TEST_TOKEN_RESPONSE);
      clientMock.getUser.mockResolvedValue(undefined);
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      let returnedToken;
      await act(async () => {
        returnedToken = await result.current.switchToken({tenantId: 'foo'});
      });
      expect(returnedToken).toBe(TEST_TOKEN_RESPONSE);
    });
  });

  describe('handleRedirectCallback', () => {
    it('should provide a handleRedirectCallback method', async () => {
      clientMock.handleRedirectCallback.mockResolvedValue({
        appState: {redirectUri: '/'},
      });
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.handleRedirectCallback).toBeInstanceOf(Function));
      await act(async () => {
        const response = await result.current.handleRedirectCallback();
        expect(response).toStrictEqual({
          appState: {
            redirectUri: '/',
          },
        });
      });
      expect(clientMock.handleRedirectCallback).toHaveBeenCalled();
    });

    it('should call handleRedirectCallback in the scope of the LoopAuth client', async () => {
      clientMock.handleRedirectCallback.mockReturnThis();
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      // await waitForNextUpdate();
      await act(async () => {
        const returnedThis = await result.current.handleRedirectCallback();
        expect(returnedThis).toStrictEqual(clientMock);
      });
    });

    it('should update auth state after handleRedirectCallback', async () => {
      clientMock.handleRedirectCallback.mockReturnThis();
      clientMock.getUser.mockResolvedValue({id: 'foo'});
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      // await waitForNextUpdate();

      const prevUser = result.current.user;
      clientMock.getUser.mockResolvedValue({id: 'foo'});
      await act(async () => {
        await result.current.handleRedirectCallback();
      });
      expect(result.current.user).not.toBe(prevUser);
    });

    it('should update auth state after handleRedirectCallback fails', async () => {
      clientMock.handleRedirectCallback.mockReturnThis();
      clientMock.getUser.mockResolvedValue({id: 'foo'});
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.isAuthenticated).toBeTruthy());
      clientMock.handleRedirectCallback.mockRejectedValueOnce({
        error: 'login_required',
      });
      clientMock.getUser.mockResolvedValue(undefined);
      await act(async () => {
        await expect(() => result.current.handleRedirectCallback()).rejects.toThrowError('login_required');
      });
      expect(result.current.isAuthenticated).toBeFalsy();
    });

    it('should ignore same auth state after handleRedirectCallback', async () => {
      clientMock.handleRedirectCallback.mockReturnThis();
      const userObject = {id: 'foo'};
      clientMock.getUser.mockResolvedValue(userObject);
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      await waitFor(() => expect(result.current.user).toBeDefined());
      const prevState = result.current;
      clientMock.getUser.mockResolvedValue(userObject);
      await act(async () => {
        await result.current.handleRedirectCallback();
      });
      expect(result.current).toBe(prevState);
    });

    it('should normalize errors from handleRedirectCallback method', async () => {
      clientMock.handleRedirectCallback.mockRejectedValue(new ProgressEvent('error'));
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      // await waitForNextUpdate();
      await act(async () => {
        await expect(result.current.handleRedirectCallback).rejects.toThrowError('Get access token failed');
      });
    });

    it('should handle not having a user while calling handleRedirectCallback', async () => {
      clientMock.handleRedirectCallback.mockResolvedValue({
        appState: {
          redirectUri: '/',
        },
      });
      clientMock.getUser.mockResolvedValue(undefined);
      const wrapper = createWrapper();
      const {result} = renderHook(() => useContext(LoopAuthContext), {
        wrapper,
      });
      let returnedToken;
      await act(async () => {
        returnedToken = await result.current.handleRedirectCallback();
      });
      expect(returnedToken).toStrictEqual({
        appState: {
          redirectUri: '/',
        },
      });
    });

    it('should only handle redirect callback once', async () => {
      window.history.pushState({}, document.title, '/?code=__test_code__&state=__test_state__');
      clientMock.handleRedirectCallback.mockResolvedValue({
        appState: undefined,
      });
      render(
        <StrictMode>
          <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="" />
        </StrictMode>,
      );
      await waitFor(() => {
        expect(clientMock.handleRedirectCallback).toHaveBeenCalledTimes(1);
        expect(clientMock.getUser).toHaveBeenCalled();
      });
    });
  });

  it('should not update context value after rerender with no state change', async () => {
    clientMock.getTokenSilently.mockReturnThis();
    clientMock.getUser.mockResolvedValue({id: 'foo'});
    const wrapper = createWrapper();
    const {result, rerender} = renderHook(() => useContext(LoopAuthContext), {
      wrapper,
    });
    await waitFor(() => expect(result.current.user).toBeDefined());
    const memoized = result.current;
    rerender();
    expect(result.current).toBe(memoized);
  });

  it('should allow nesting providers', async () => {
    // Calls happen up the tree, i.e the nested LoopAuthProvider will get undefined and the top level will get a return value
    clientMock.getUser.mockResolvedValueOnce({id: '__custom_user__'});
    clientMock.getUser.mockResolvedValueOnce({id: '__main_user__'});
    const context = React.createContext<ILoopAuthContext>(InitialContext);

    const MyComponent = () => {
      const {user} = useLoopAuth(context);
      return <div>{user?.id}</div>;
    };

    await act(async () => {
      render(
        <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
          <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" context={context} loginPath="">
            <MyComponent />
          </LoopAuthProvider>
        </LoopAuthProvider>,
      );
    });

    expect(clientMock.getUser).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('__custom_user__')).toBeInTheDocument();
    expect(screen.queryByText('__main_user__')).not.toBeInTheDocument();
  });
});
