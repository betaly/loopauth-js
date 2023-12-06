import {User} from '@loopauth/client';

import {AuthState} from './state';

type Action =
  | {type: 'LOGIN_POPUP_STARTED'}
  | {
      type:
        | 'INITIALISED'
        | 'LOGIN_POPUP_COMPLETE'
        | 'GET_ACCESS_TOKEN_COMPLETE'
        | 'SWITCH_TOKEN_COMPLETE'
        | 'HANDLE_REDIRECT_COMPLETE';
      user?: User;
    }
  | {type: 'LOGOUT'}
  | {type: 'ERROR'; error: Error};

/**
 * Handles how that state changes in the `useLoopAuth` hook.
 */
export const reducer = (state: AuthState, action: Action): AuthState => {
  switch (action.type) {
    case 'LOGIN_POPUP_STARTED':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_POPUP_COMPLETE':
    case 'INITIALISED':
      return {
        ...state,
        isAuthenticated: !!action.user,
        user: action.user,
        isLoading: false,
        error: undefined,
      };
    case 'HANDLE_REDIRECT_COMPLETE':
    case 'GET_ACCESS_TOKEN_COMPLETE':
    case 'SWITCH_TOKEN_COMPLETE':
      if (state.user === action.user) {
        return state;
      }
      return {
        ...state,
        isAuthenticated: !!action.user,
        user: action.user,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: undefined,
      };
    case 'ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
  }
};