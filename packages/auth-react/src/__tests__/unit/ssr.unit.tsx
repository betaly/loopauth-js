/**
 * @jest-environment node
 */
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {LoopAuthContext} from '../../auth-context';
import {LoopAuthProvider} from '../../auth-provider';

jest.unmock('@loopauth/auth-browser');

describe('In a Node SSR environment', () => {
  it('auth state is initialised', async () => {
    let isLoading, isAuthenticated, user, loginWithRedirect;
    ReactDOMServer.renderToString(
      <LoopAuthProvider clientId="__client_id__" domain="__domain__" loginPath="https://example.com/login">
        <LoopAuthContext.Consumer>
          {(value): React.JSX.Element => {
            ({isLoading, isAuthenticated, user, loginWithRedirect} = value);
            return <div>App</div>;
          }}
        </LoopAuthContext.Consumer>
      </LoopAuthProvider>,
    );
    expect(isLoading).toBeTruthy();
    expect(isAuthenticated).toBeFalsy();
    expect(user).toBeUndefined();
    await expect(loginWithRedirect).rejects.toThrowError('sessionStorage is not defined');
  });
});
