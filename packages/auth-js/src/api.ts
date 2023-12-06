import pick from 'object.pick';
import UrlSafer from 'urlsafer';

import {DEFAULT_AUTH_CLIENT} from './constants';
import {fetchJson} from './fetch';
import {
  isCodeExchangeEndpointOptions,
  isRefreshTokenEndpointOptions,
  isSwitchTokenEndpointOptions,
} from './type-guards';
import {
  CodeRequestTokenOptionsKeys,
  Fetcher,
  LogoutEndpointOptions,
  LogoutEndpointResponse,
  RefreshTokenRequestTokenOptionsKeys,
  SwitchTokenRequestTokenOptionsKeys,
  TokenEndpointOptions,
  TokenEndpointResponse,
} from './types';
import {createFormParams} from './utils';

export async function fetchToken(
  {baseUrl, useFormData, timeout, authClient, ...options}: TokenEndpointOptions,
  fetcher?: Fetcher,
) {
  if (
    !isCodeExchangeEndpointOptions(options) &&
    !isRefreshTokenEndpointOptions(options) &&
    !isSwitchTokenEndpointOptions(options)
  ) {
    throw new Error('Missing code or refreshToken');
  }

  let url;
  let data;
  if (isCodeExchangeEndpointOptions(options)) {
    url = `${baseUrl}/auth/token`;
    data = pick(options, CodeRequestTokenOptionsKeys);
  } else if (isRefreshTokenEndpointOptions(options)) {
    url = `${baseUrl}/auth/token-refresh`;
    data = pick(options, RefreshTokenRequestTokenOptionsKeys);
  } else {
    url = `${baseUrl}/auth/token-switch`;
    data = pick(options, SwitchTokenRequestTokenOptionsKeys);
  }

  const body = useFormData ? createFormParams(data) : JSON.stringify(data);
  const contentType = useFormData ? 'application/x-www-form-urlencoded' : 'application/json';

  return fetchJson<TokenEndpointResponse>(
    url,
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': contentType,
        'LoopAuth-Client': UrlSafer.encode(JSON.stringify(authClient || DEFAULT_AUTH_CLIENT)),
      },
      timeout,
    },
    fetcher,
  );
}

export async function postLogout({url, accessToken, refreshToken, timeout}: LogoutEndpointOptions, fetcher?: Fetcher) {
  const body = JSON.stringify({
    refreshToken,
  });

  return fetchJson<LogoutEndpointResponse>(
    url,
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      timeout,
    },
    fetcher,
  );
}
