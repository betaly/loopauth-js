import {expect} from '@jest/globals';

import {AuthClientOptions, GetTokenSilentlyOptions, RedirectLoginOptions, SwitchTokenOptions} from '../../..';
import {AuthClient} from '../../../client';
import {verify} from '../../../tokens';
import {
  TEST_ACCESS_TOKEN,
  TEST_AUTH_PROVIDER,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_DOMAIN,
  TEST_REDIRECT_URI,
  TEST_REFRESH_TOKEN,
  TEST_TENANT_ID,
} from '../../constants';
import {WebAuthClient} from '../../fixtures/web-auth-client';

export const assertPostFn = (mockFetch: jest.Mock) => {
  return (url: string, body: any, headers: Record<string, string> | null = null, callNum = 0, json = true) => {
    const [actualUrl, call] = mockFetch.mock.calls[callNum];

    expect(url).toEqual(actualUrl);

    expect(body).toEqual(
      json
        ? JSON.parse(call.body)
        : Array.from(new URLSearchParams(call.body).entries()).reduce(
            (acc, curr) => ({...acc, [curr[0]]: curr[1]}),
            {},
          ),
    );

    if (headers) {
      Object.keys(headers).forEach(header => expect(headers[header]).toEqual(call.headers[header]));
    }
  };
};

/**
 * Extracts the keys and values from an IterableIterator and applies
 * them to an object.
 * @param itor The iterable
 * @returns An object with the keys and values from the iterable
 */
const itorToObject = <K extends string | number | symbol, V>(itor: IterableIterator<[K, V]>): Record<K, V> =>
  [...itor].reduce((m, [key, value]) => {
    m[key] = value;
    return m;
  }, {} as Record<K, V>);

/**
 * Asserts that the supplied URL matches various criteria, including host, path, and query params.
 * @param actualUrl The URL
 * @param host The host
 * @param path The URL path
 * @param queryParams The query parameters to check
 * @param strict If true, the query parameters must match the URL parameters exactly. Otherwise, a loose match is performed to check that
 * the parameters passed in at least appear in the URL (but the URL can have extra ones). Default is true.
 */
export const assertUrlEquals = (
  actualUrl: URL | string,
  host: string,
  path: string,
  queryParams: Record<string, any>,
  strict = true,
) => {
  const url = new URL(actualUrl);
  const searchParamsObj = itorToObject(url.searchParams.entries());

  expect(url.host).toEqual(host);
  expect(url.pathname).toEqual(path);

  if (strict) {
    expect(searchParamsObj).toStrictEqual({
      authClient: expect.any(String),
      ...queryParams,
    });
  } else {
    expect(searchParamsObj).toMatchObject(queryParams);
  }
};

export const fetchResponse = <T>(ok: boolean, json: T) =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(json),
  });

export const setupFn = (mockVerify: jest.Mock) => {
  return (config?: Partial<AuthClientOptions>) => {
    const options: AuthClientOptions = {
      domain: TEST_DOMAIN,
      authProvider: TEST_AUTH_PROVIDER,
      clientId: TEST_CLIENT_ID,
      authorizationParams: {
        redirect_uri: TEST_REDIRECT_URI,
      },
    };

    Object.assign(options.authorizationParams!, config?.authorizationParams);

    delete config?.authorizationParams;

    Object.assign(options, config);

    const client = new WebAuthClient(options);

    mockVerify.mockReturnValue({
      user: {
        id: 'me',
      },
    });

    return client;
  };
};

const processDefaultLoginWithRedirectOptions = (config: any) => {
  const defaultTokenResponseOptions = {
    success: true,
    response: {},
  };
  const defaultAuthorizeResponseOptions = {
    code: TEST_CODE,
  };
  const token = {
    ...defaultTokenResponseOptions,
    ...(config.token || {}),
  };
  const authorize = {
    ...defaultAuthorizeResponseOptions,
    ...(config.authorize || {}),
  };

  return {
    token,
    authorize,
    useHash: config.useHash,
    customCallbackUrl: config.customCallbackUrl,
  };
};

export const loginWithRedirectFn = (mockWindow: any, mockFetch: any) => {
  return async (
    client: AuthClient,
    options: RedirectLoginOptions | undefined = undefined,
    testConfig: {
      token?: {
        success?: boolean;
        response?: any;
      };
      authorize?: {
        code?: string;
        error?: string;
        errorDescription?: string;
      };
      useHash?: boolean;
      customCallbackUrl?: string;
    } = {
      token: {},
      authorize: {},
    },
  ) => {
    const {
      token,
      authorize: {code, error, errorDescription},
      useHash,
      customCallbackUrl,
    } = processDefaultLoginWithRedirectOptions(testConfig);
    await client.loginWithRedirect(options);

    if (!options || options.openUrl == null) {
      expect(mockWindow.location.assign).toHaveBeenCalled();
    }

    if (error && errorDescription) {
      window.history.pushState({}, '', `/${useHash ? '#' : ''}?error=${error}&error_description=${errorDescription}`);
    } else if (error) {
      window.history.pushState({}, '', `/${useHash ? '#' : ''}?error=${error}`);
    } else if (code) {
      window.history.pushState({}, '', `/${useHash ? '#' : ''}?code=${code}`);
    } else {
      window.history.pushState({}, '', `/`);
    }

    mockFetch.mockResolvedValueOnce(
      fetchResponse(
        token.success,
        Object.assign(
          {
            // idToken: TEST_ID_TOKEN,
            refreshToken: TEST_REFRESH_TOKEN,
            accessToken: TEST_ACCESS_TOKEN,
            expiresIn: 86400,
          },
          token.response,
        ),
      ),
    );

    return client.handleRedirectCallback(customCallbackUrl);
  };
};

export const setupMessageEventLister = (mockWindow: any, response: any = {}, delay = 0) => {
  mockWindow.addEventListener.mockImplementationOnce((type: string, cb: (event: unknown) => void) => {
    if (type === 'message') {
      setTimeout(() => {
        cb({
          data: {
            type: 'authorization_response',
            response,
          },
        });
      }, delay);
    }
  });

  mockWindow.open.mockReturnValue({
    close: () => {},
    location: {
      href: '',
    },
  });
};

const processDefaultTokenOptions = (config: any) => {
  const defaultTokenResponseOptions = {
    success: true,
    response: {},
  };
  const token = {
    ...defaultTokenResponseOptions,
    ...(config.token || {}),
  };

  return {
    token,
  };
};

export const getTokenSilentlyFn = (mockWindow: any, mockFetch: any) => {
  return async (
    client: AuthClient,
    options: GetTokenSilentlyOptions | undefined = undefined,
    testConfig: {
      token?: {
        success?: boolean;
        response?: any;
      };
    } = {
      token: {},
    },
  ) => {
    const {token} = processDefaultTokenOptions(testConfig);

    mockFetch.mockResolvedValueOnce(
      fetchResponse(
        token.success,
        Object.assign(
          {
            // id_token: TEST_ID_TOKEN,
            refreshToken: TEST_REFRESH_TOKEN,
            accessToken: TEST_ACCESS_TOKEN,
            expiresIn: 86400,
          },
          token.response,
        ),
      ),
    );

    return client.getTokenSilently(options);
  };
};

export const switchTokenFn = (mockWindow: any, mockFetch: any) => {
  return async (
    client: AuthClient,
    options: SwitchTokenOptions | undefined = undefined,
    testConfig: {
      token?: {
        success?: boolean;
        response?: any;
      };
    } = {
      token: {},
    },
  ) => {
    const {token} = processDefaultTokenOptions(testConfig);

    mockFetch.mockResolvedValueOnce(
      fetchResponse(
        token.success,
        Object.assign(
          {
            // id_token: TEST_ID_TOKEN,
            refreshToken: TEST_REFRESH_TOKEN,
            accessToken: TEST_ACCESS_TOKEN,
            expiresIn: 86400,
          },
          token.response,
        ),
      ),
    );

    return client.switchToken({tenantId: TEST_TENANT_ID, ...options});
  };
};

export function prepareClientMocks() {
  const mockWindow = <any>global;
  const mockFetch = <jest.Mock>mockWindow.fetch;
  const mockVerify = <jest.Mock>verify;

  const setup = setupFn(mockVerify);

  const oldWindowLocation = window.location;

  beforeEach(() => {
    // https://www.benmvp.com/blog/mocking-window-location-methods-jest-jsdom/
    // @ts-ignore
    delete window.location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(oldWindowLocation),
        assign: {
          configurable: true,
          value: jest.fn(),
        },
        replace: {
          configurable: true,
          value: jest.fn(),
        },
      },
    ) as Location;
    // --

    mockWindow.open = jest.fn();
    mockWindow.addEventListener = jest.fn();
    sessionStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  return {
    setup,
    mockWindow,
    mockFetch,
    mockVerify,
  };
}
