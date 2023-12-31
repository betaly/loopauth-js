import UrlSafer from 'urlsafer';

import version from '../version';

export const TEST_AUTH_CLIENT_QUERY_STRING = `&authClient=${encodeURIComponent(
  UrlSafer.encode(
    JSON.stringify({
      name: 'auth-js',
      version: version,
    }),
  ),
)}`;

export const TEST_TENANT_ID = 'tenant_1';
export const TEST_AUTH_PROVIDER = 'autha';
export const TEST_DOMAIN = 'auth_domain';
export const TEST_CLIENT_ID = 'auth_client_id';
export const TEST_REDIRECT_URI = 'my_callback_url';
export const TEST_AUDIENCE = 'my_audience';
export const TEST_ID_TOKEN = 'my_id_token';
export const TEST_ACCESS_TOKEN = 'my_access_token';
export const TEST_REFRESH_TOKEN = 'my_refresh_token';
// export const TEST_STATE = 'MTIz';
// export const TEST_NONCE = 'MTIz';
export const TEST_CODE = 'my_code';
// export const TEST_SCOPES = DEFAULT_SCOPE;
export const TEST_CLIENT_CHALLENGE = 'TEST_CLIENT_CHALLENGE';
// export const TEST_CODE_VERIFIER = '123';
export const GET_TOKEN_SILENTLY_LOCK_KEY = 'auth.lock.getTokenSilently';
// export const TEST_QUERY_PARAMS = 'query=params';
// export const TEST_ENCODED_STATE = 'encoded-state';
// export const TEST_RANDOM_STRING = 'random-string';
// export const TEST_ARRAY_BUFFER = 'this-is-an-array-buffer';
// export const TEST_BASE64_ENCODED_STRING = 'base64-url-encoded-string';
// export const TEST_USER_ID = 'user-id';
// export const TEST_USER_EMAIL = 'user@email.com';
// export const TEST_APP_STATE = {bestPet: 'dog'};
// export const TEST_ORG_ID = 'org_id_123';

export const nowSeconds = () => Math.floor(Date.now() / 1000);
export const dayInSeconds = 86400;
