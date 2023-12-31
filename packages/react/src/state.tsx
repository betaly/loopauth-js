import {User} from '@loopauth/client';

export interface AuthState<TUser extends User = User> {
  error?: Error;
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: TUser;
}

export const InitialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
};
