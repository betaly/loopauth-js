import {expect} from '@jest/globals';
import UrlSafer from 'urlsafer';

import {fetchToken} from '../../api';
import {DEFAULT_AUTH_CLIENT, DEFAULT_SILENT_TOKEN_RETRY_COUNT} from '../../constants';
import version from '../../version';

const mockFetch = <jest.Mock>fetch;
(<any>global).fetch = mockFetch;

describe('fetchToken', () => {
  let abortController: AbortController;

  beforeEach(() => {
    const fetchModule = require('../../fetch');

    // Set up an AbortController that we can test has been called in the event of a timeout
    abortController = new AbortController();
    jest.spyOn(abortController, 'abort');
    (fetchModule as any).createAbortController = jest.fn(() => abortController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('calls auth/token with the correct url', async () => {
    mockFetch.mockReturnValue(new Promise(res => res({ok: true, json: () => new Promise(ress => ress(true))})));
    const authClient = {
      name: 'auth-js',
      version: version,
    };

    const options = {
      clientId: 'client_idIn',
      code: 'codeIn',
    };

    await fetchToken({...options, authClient, baseUrl: 'https://test.com'});

    expect(mockFetch).toBeCalledWith('https://test.com/auth/token', {
      body: JSON.stringify(options),
      headers: {
        'Content-Type': 'application/json',
        'LoopAuth-Client': UrlSafer.encode(JSON.stringify(authClient)),
      },
      method: 'POST',
      signal: abortController.signal,
    });

    expect(mockFetch.mock.calls[0][1].signal).not.toBeUndefined();
  });

  it('handles error with error response', async () => {
    const theError = {
      error: 'the-error',
      error_description: 'the-error-description',
    };

    mockFetch.mockReturnValue(
      new Promise(res =>
        res({
          ok: false,
          json: () => new Promise(ress => ress(theError)),
        }),
      ),
    );

    try {
      await fetchToken({
        baseUrl: 'https://test.com',
        clientId: 'client_idIn',
        code: 'codeIn',
        authClient: DEFAULT_AUTH_CLIENT,
      });
    } catch (error) {
      expect(error.message).toBe(theError.error_description);
      expect(error.error).toBe(theError.error);
      expect(error.error_description).toBe(theError.error_description);
    }
  });

  it('handles error without error response', async () => {
    mockFetch.mockReturnValue(
      new Promise(res =>
        res({
          ok: false,
          json: () => new Promise(ress => ress(false)),
        }),
      ),
    );

    try {
      await fetchToken({
        baseUrl: 'https://test.com',
        clientId: 'client_idIn',
        code: 'codeIn',
        authClient: DEFAULT_AUTH_CLIENT,
      });
    } catch (error) {
      expect(error.message).toBe(`HTTP error. Unable to fetch https://test.com/auth/token`);
      expect(error.error).toBe('request_error');
      expect(error.error_description).toBe(`HTTP error. Unable to fetch https://test.com/auth/token`);
    }
  });

  it('retries the request in the event of a network failure', async () => {
    // Fetch only fails in the case of a network issue, so should be
    // retried here. Failure status (4xx, 5xx, etc) return a resolved Promise
    // with the failure in the body.
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
    mockFetch.mockReturnValue(Promise.reject(new Error('Network failure')));

    try {
      await fetchToken({
        baseUrl: 'https://test.com',
        clientId: 'client_idIn',
        code: 'codeIn',
        authClient: DEFAULT_AUTH_CLIENT,
      });
    } catch (error) {
      expect(error.message).toBe('Network failure');

      expect(mockFetch).toHaveBeenCalledTimes(DEFAULT_SILENT_TOKEN_RETRY_COUNT);
    }
  });

  it('continues the program after failing a couple of times then succeeding', async () => {
    // Fetch only fails in the case of a network issue, so should be
    // retried here. Failure status (4xx, 5xx, etc) return a resolved Promise
    // with the failure in the body.
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
    mockFetch
      .mockReturnValueOnce(Promise.reject(new Error('Network failure')))
      .mockReturnValueOnce(Promise.reject(new Error('Network failure')))
      .mockReturnValue(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({accessToken: 'access-token'}),
        }),
      );

    const result = await fetchToken({
      baseUrl: 'https://test.com',
      clientId: 'client_idIn',
      code: 'codeIn',
      authClient: DEFAULT_AUTH_CLIENT,
    });

    expect(result.accessToken).toBe('access-token');
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(abortController.abort).not.toHaveBeenCalled();
  });

  it('throws a fetch error when the network is down', async () => {
    mockFetch.mockReturnValue(Promise.reject(new Error('Failed to fetch')));

    await expect(
      fetchToken({
        baseUrl: 'https://test.com',
        clientId: 'client_idIn',
        code: 'codeIn',
        authClient: DEFAULT_AUTH_CLIENT,
      }),
    ).rejects.toMatchObject({message: 'Failed to fetch'});
  });

  it('surfaces a timeout error when the fetch continuously times out', async () => {
    const createPromise = () =>
      new Promise((resolve, _) => {
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: () => Promise.resolve({accessToken: 'access-token'}),
            }),
          500,
        );
      });

    mockFetch.mockReturnValue(createPromise());

    try {
      await fetchToken({
        baseUrl: 'https://test.com',
        clientId: 'client_idIn',
        code: 'codeIn',
        timeout: 100,
        authClient: DEFAULT_AUTH_CLIENT,
      });
    } catch (e) {
      expect(e.message).toBe("Timeout when executing 'fetch'");
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(abortController.abort).toHaveBeenCalledTimes(3);
    }
  });

  it('retries the request in the event of a timeout', async () => {
    const fetchResult = {
      ok: true,
      json: () => Promise.resolve({accessToken: 'access-token'}),
    };

    mockFetch.mockReturnValueOnce(
      new Promise((resolve, _) => {
        setTimeout(() => resolve(fetchResult), 1000);
      }),
    );

    mockFetch.mockReturnValue(Promise.resolve(fetchResult));

    const result = await fetchToken({
      baseUrl: 'https://test.com',
      clientId: 'client_idIn',
      code: 'codeIn',
      timeout: 500,
      authClient: DEFAULT_AUTH_CLIENT,
    });

    expect(result.accessToken).toBe('access-token');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(abortController.abort).toHaveBeenCalled();
  });
});
