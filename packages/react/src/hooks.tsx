import {User} from '@loopauth/client';
import {useContext} from 'react';

import {ILoopAuthContext, LoopAuthContext} from './auth-context';

/**
 * ```js
 * const {
 *   // Auth state:
 *   error,
 *   isAuthenticated,
 *   isLoading,
 *   user,
 *   // Auth methods:
 *   getAccessTokenSilently,
 *   loginWithRedirect,
 *   logout,
 * } = useLoopAuth<TUser>();
 * ```
 *
 * Use the `useLoopAuth` hook in your components to access the auth state and methods.
 *
 * TUser is an optional type param to provide a type to the `user` field.
 */
export const useLoopAuth = <TUser extends User = User>(context = LoopAuthContext): ILoopAuthContext<TUser> =>
  useContext(context) as ILoopAuthContext<TUser>;

// export default useLoopAuth;
