import {DEFAULT_FETCH_TIMEOUT_MS, DEFAULT_SILENT_TOKEN_RETRY_COUNT} from './constants';
import {GenericError, MfaRequiredError, MissingRefreshTokenError, RemoteError} from './errors';
import {Fetcher, FetchOptions} from './types';

export const createAbortController = () => new AbortController();

export const fetchDirectly = async (
  url: string,
  fetchOptions: FetchOptions,
  timeout = DEFAULT_FETCH_TIMEOUT_MS,
  fetcher?: Fetcher,
) => {
  const controller = createAbortController();
  fetchOptions.signal = controller.signal;

  let timeoutId: NodeJS.Timeout;

  // The promise will resolve with one of these two promises (the fetch or the timeout), whichever completes first.
  return Promise.race([
    doFetch(url, fetchOptions, fetcher),

    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error("Timeout when executing 'fetch'"));
      }, timeout);
    }),
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

export const switchFetch = async (url: string, {timeout, ...fetchOptions}: FetchOptions, fetcher?: Fetcher) => {
  timeout = timeout ?? DEFAULT_FETCH_TIMEOUT_MS;
  // TODO add fetchWithWorker. auth0-spa-js uses it.
  return fetchDirectly(url, fetchOptions, timeout, fetcher);
};

export async function fetchJson<T>(url: string, fetchOptions: FetchOptions, fetcher?: Fetcher): Promise<T> {
  let fetchError: null | Error = null;
  let response: any;

  for (let i = 0; i < DEFAULT_SILENT_TOKEN_RETRY_COUNT; i++) {
    try {
      response = await switchFetch(url, fetchOptions, fetcher);
      fetchError = null;
      break;
    } catch (e) {
      // Fetch only fails in the case of a network issue, so should be
      // retried here. Failure status (4xx, 5xx, etc) return a resolved Promise
      // with the failure in the body.
      // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
      fetchError = e;
    }
  }

  if (fetchError) {
    throw fetchError;
  }

  const {json, ok} = response;

  if (!ok) {
    let error: RemoteError;
    if (typeof json.error === 'string') {
      error = {errorCode: json.error, message: json.error_description};
    } else {
      error = json.error;
    }
    const {message, errorCode} = error ?? {};
    const errorMessage = message || `HTTP error. Unable to fetch ${url}`;

    if (errorCode === 'mfa_required') {
      throw new MfaRequiredError(errorCode, errorMessage, json.mfa_token);
    }

    if (errorCode === 'missing_refresh_token') {
      throw new MissingRefreshTokenError();
    }

    throw new GenericError(errorCode || 'request_error', errorMessage);
  }

  return json;
}

const doFetch = async (fetchUrl: string, fetchOptions: FetchOptions, fetcher?: Fetcher) => {
  fetcher = fetcher || (fetch as Fetcher);
  const response = await fetcher(fetchUrl, fetchOptions);

  return {
    ok: response.ok,
    json: await response.json(),
  };
};
