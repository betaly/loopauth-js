import {AuthError} from './errors';

const CODE_RE = /[?&]code=[^&]+/;
const ERROR_RE = /[?&]error=[^&]+/;
const STATE_RE = /[?&]state=[^&]+/;

export const hasAuthParams = (searchParams = window.location.search): boolean =>
  // (CODE_RE.test(searchParams) || ERROR_RE.test(searchParams)) && STATE_RE.test(searchParams);
  CODE_RE.test(searchParams) || ERROR_RE.test(searchParams);

const normalizeErrorFn =
  (fallbackMessage: string) =>
  (error: unknown | Error | {error?: string; error_description?: string}): Error => {
    if (error instanceof Error) {
      return error;
    }
    // try to check errors of the following form: {error: string; error_description?: string}
    if (error !== null && typeof error === 'object' && 'error' in error && typeof error.error === 'string') {
      if ('error_description' in error && typeof error.error_description === 'string') {
        return new AuthError(error.error, error.error_description);
      }
      return new AuthError(error.error);
    }
    return new Error(fallbackMessage);
  };

export const loginError = normalizeErrorFn('Login failed');

export const getTokenError = normalizeErrorFn('Get access token failed');

export const switchTokenError = normalizeErrorFn('Switch token failed');
