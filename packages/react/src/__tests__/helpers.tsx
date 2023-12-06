import {LoopAuthProvider, LoopAuthProviderOptions} from '../auth-provider';
import React, {PropsWithChildren} from 'react';

export const createWrapper = ({
  clientId = '__test_client_id__',
  domain = '__test_domain__',
  loginPath = 'https://loopauth.dev/auth/login',
  ...opts
}: Partial<LoopAuthProviderOptions> = {}) => {
  return function Wrapper({children}: PropsWithChildren<Record<string, unknown>>): React.JSX.Element {
    return (
      // eslint-disable-next-line prettier/prettier
      <LoopAuthProvider domain={domain} clientId={clientId} loginPath={loginPath} {...opts}>
        {children}
      </LoopAuthProvider>
    );
  };
};

export interface Defer<TData> {
  resolve: (value: TData | PromiseLike<TData>) => void;
  reject: (reason?: unknown) => void;
  promise: Promise<TData>;
}

export function defer<TData>() {
  const deferred: Defer<TData> = {} as unknown as Defer<TData>;

  deferred.promise = new Promise<TData>(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}
