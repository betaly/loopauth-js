import '@testing-library/jest-dom';

import {User, WebAuthClient} from '@loopauth/auth-browser';
import {act, render, screen, waitFor} from '@testing-library/react';
import React from 'react';

import {ILoopAuthContext, InitialContext} from '../../auth-context';
import {LoopAuthProvider} from '../../auth-provider';
import withAuthenticationRequired from '../../with-authentication-required';
import {defer} from '../helpers';

const mockClient = jest.mocked(new WebAuthClient({clientId: '', domain: ''}));

describe('withAuthenticationRequired', () => {
  it('should block access to a private component when not authenticated', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): React.JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent);
    render(
      <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
        <WrappedComponent />
      </LoopAuthProvider>,
    );
    await waitFor(() => expect(mockClient.loginWithRedirect).toHaveBeenCalled());
    expect(screen.queryByText('Private')).not.toBeInTheDocument();
  });

  it('should allow access to a private component when authenticated', async () => {
    mockClient.getUser.mockResolvedValue({id: '__test_user__'});
    const MyComponent = (): React.JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent);
    await act(async () => {
      render(
        <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
          <WrappedComponent />
        </LoopAuthProvider>,
      );
    });

    await waitFor(() => expect(mockClient.loginWithRedirect).not.toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Private')).toBeInTheDocument());
  });

  it('should show a custom redirecting message when not authenticated', async () => {
    const deferred = defer<User | undefined>();
    mockClient.getUser.mockResolvedValue(deferred.promise);

    const MyComponent = (): React.JSX.Element => <>Private</>;
    const OnRedirecting = (): React.JSX.Element => <>Redirecting</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      onRedirecting: OnRedirecting,
    });
    const {rerender} = await act(() =>
      render(
        <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
          <WrappedComponent />
        </LoopAuthProvider>,
      ),
    );

    await waitFor(() => expect(screen.getByText('Redirecting')).toBeInTheDocument());

    deferred.resolve({id: '__test_user__'});

    rerender(
      <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
        <WrappedComponent />
      </LoopAuthProvider>,
    );
    await waitFor(() => expect(screen.queryByText('Redirecting')).not.toBeInTheDocument());
  });

  it('should call onBeforeAuthentication before loginWithRedirect', async () => {
    const callOrder: string[] = [];
    mockClient.getUser.mockResolvedValue(undefined);
    mockClient.loginWithRedirect.mockImplementationOnce(async () => {
      callOrder.push('loginWithRedirect');
    });
    const MyComponent = (): React.JSX.Element => <>Private</>;
    const OnBeforeAuthentication = jest.fn().mockImplementationOnce(async () => {
      callOrder.push('onBeforeAuthentication');
    });
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      onBeforeAuthentication: OnBeforeAuthentication,
    });
    render(
      <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
        <WrappedComponent />
      </LoopAuthProvider>,
    );

    await waitFor(() => expect(OnBeforeAuthentication).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockClient.loginWithRedirect).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(callOrder).toEqual(['onBeforeAuthentication', 'loginWithRedirect']));
  });

  it('should pass additional options on to loginWithRedirect', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): React.JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      loginOptions: {
        fragment: 'foo',
      },
    });
    render(
      <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
        <WrappedComponent />
      </LoopAuthProvider>,
    );
    await waitFor(() =>
      expect(mockClient.loginWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          fragment: 'foo',
        }),
      ),
    );
  });

  it('should merge additional appState with the returnTo', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): React.JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      loginOptions: {
        appState: {
          foo: 'bar',
        },
      },
      returnTo: '/baz',
    });
    render(
      <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
        <WrappedComponent />
      </LoopAuthProvider>,
    );
    await waitFor(() =>
      expect(mockClient.loginWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          appState: {
            foo: 'bar',
            returnTo: '/baz',
          },
        }),
      ),
    );
  });

  it('should accept a returnTo function', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): React.JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      returnTo: () => '/foo',
    });
    render(
      <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
        <WrappedComponent />
      </LoopAuthProvider>,
    );
    await waitFor(() =>
      expect(mockClient.loginWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          appState: {
            returnTo: '/foo',
          },
        }),
      ),
    );
  });

  it('should call loginWithRedirect only once even if parent state changes', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): React.JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent);
    const App = ({foo}: {foo: number}): React.JSX.Element => (
      <div>
        {foo}
        <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
          <WrappedComponent />
        </LoopAuthProvider>
      </div>
    );
    const {rerender} = render(<App foo={1} />);
    await waitFor(() => expect(mockClient.loginWithRedirect).toHaveBeenCalled());
    mockClient.loginWithRedirect.mockClear();
    rerender(<App foo={2} />);
    await waitFor(() => expect(mockClient.loginWithRedirect).not.toHaveBeenCalled());
  });

  it('should provide access when the provider associated with the context is authenticated', async () => {
    // Calls happen up the tree, i.e the nested LoopAuthProvider will get a return value and the top level will get undefined
    mockClient.getUser.mockResolvedValueOnce({id: '__test_user__'});
    mockClient.getUser.mockResolvedValueOnce(undefined);
    const context = React.createContext<ILoopAuthContext>(InitialContext);
    const MyComponent = (): React.JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      context,
    });
    await act(async () => {
      render(
        <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
          <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" context={context} loginPath="">
            <WrappedComponent />
          </LoopAuthProvider>
        </LoopAuthProvider>,
      );
    });

    await waitFor(() => expect(mockClient.loginWithRedirect).not.toHaveBeenCalled());
    // There should be one call per provider
    expect(mockClient.getUser).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Private')).toBeInTheDocument();
  });

  it('should block access when the provider associated with the context is not authenticated', async () => {
    // Calls happen up the tree, i.e the nested LoopAuthProvider will get undefined and the top level will get a return value
    mockClient.getUser.mockResolvedValueOnce(undefined);
    mockClient.getUser.mockResolvedValueOnce({id: '__test_user__'});
    const context = React.createContext<ILoopAuthContext>(InitialContext);
    const MyComponent = (): React.JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      context,
    });
    await act(async () => {
      render(
        <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" loginPath="">
          <LoopAuthProvider clientId="__test_client_id__" domain="__test_domain__" context={context} loginPath="">
            <WrappedComponent />
          </LoopAuthProvider>
        </LoopAuthProvider>,
      );
    });

    await waitFor(() => expect(mockClient.loginWithRedirect).toHaveBeenCalled());
    // There should be one call per provider
    expect(mockClient.getUser).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Private')).not.toBeInTheDocument();
  });
});
