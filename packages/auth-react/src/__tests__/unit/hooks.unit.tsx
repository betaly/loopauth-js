import {ILoopAuthContext, InitialContext} from '../../auth-context';
import {useLoopAuth} from '../../hooks';
import {createWrapper} from '../helpers';
import {act, renderHook, waitFor} from '@testing-library/react';
import React from 'react';

describe('useLoopAuth', () => {
  it('should provide the auth context', async () => {
    const wrapper = createWrapper();
    const {
      result: {current},
    } = renderHook(() => useLoopAuth(), {wrapper});
    await waitFor(() => expect(current).toBeDefined());
  });

  it('should throw with no provider', () => {
    const {
      result: {current},
    } = renderHook(() => useLoopAuth());
    expect(current.loginWithRedirect).toThrowError('You forgot to wrap your component in <LoopAuthProvider>.');
  });

  it('should throw when context is not associated with provider', async () => {
    const context = React.createContext<ILoopAuthContext>(InitialContext);
    const wrapper = createWrapper({context});
    const {
      result: {current},
    } = renderHook(() => useLoopAuth(), {wrapper});
    await act(async () => {
      expect(current.loginWithRedirect).toThrowError('You forgot to wrap your component in <LoopAuthProvider>.');
    });
  });

  it('should accept custom auth context', async () => {
    const context = React.createContext<ILoopAuthContext>(InitialContext);
    const wrapper = createWrapper({context});
    const {
      result: {current},
    } = renderHook(() => useLoopAuth(context), {wrapper});
    await waitFor(() => expect(current).toBeDefined());
    expect(current.loginWithRedirect).not.toThrowError();
  });
});
