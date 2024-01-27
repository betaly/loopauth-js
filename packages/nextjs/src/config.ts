import type {Config as BaseConfig} from './auth-session/config';
import {DeepPartial, get as getBaseConfig} from './auth-session/get-config';
import type {AuthRequest, AuthRequestCookies} from './auth-session/http';

/**
 * @category server
 */
export interface NextConfig extends BaseConfig {
  /**
   * Log users in to a specific organization.
   *
   * This will specify an `organization` parameter in your user's login request and will add a step to validate
   * the `org_id` or `org_name` claim in your user's ID token.
   *
   * If your app supports multiple organizations, you should take a look at {@link AuthorizationParams.organization}.
   */
  organization?: string;
  routes: BaseConfig['routes'] & {
    login: string;
  };
}

/**
 * ## Configuration properties.
 *
 * The Server part of the SDK can be configured in 2 ways.
 *
 * ### 1. Environment Variables
 *
 * The simplest way to use the SDK is to use the named exports ({@link HandleAuth}, {@link HandleLogin},
 * {@link HandleLogout}, {@link HandleCallback}, {@link HandleProfile}, {@link GetSession}, {@link GetAccessToken},
 * {@link WithApiAuthRequired}, and {@link WithPageAuthRequired}).
 *
 * ```js
 * // pages/api/auth/[auth0].js
 * import { handleAuth } from '@loopauth/nextjs';
 *
 * return handleAuth();
 * ```
 *
 * When you use these named exports, an instance of the SDK is created for you which you can configure using
 * environment variables:
 *
 * ### Required
 *
 * - `LOOPAUTH_SECRET`: See {@link BaseConfig.secret}.
 * - `LOOPAUTH_ISSUER_BASE_URL`: See {@link BaseConfig.issuerBaseURL}.
 * - `LOOPAUTH_BASE_URL`: See {@link BaseConfig.baseURL}.
 * - `LOOPAUTH_CLIENT_ID`: See {@link BaseConfig.clientID}.
 * - `LOOPAUTH_CLIENT_SECRET`: See {@link BaseConfig.clientSecret}.
 *
 * ### Optional
 *
 * - `LOOPAUTH_CLOCK_TOLERANCE`: See {@link BaseConfig.clockTolerance}.
 * - `LOOPAUTH_HTTP_TIMEOUT`: See {@link BaseConfig.httpTimeout}.
 * - `LOOPAUTH_ENABLE_TELEMETRY`: See {@link BaseConfig.enableTelemetry}.
 * - `LOOPAUTH_IDP_LOGOUT`: See {@link BaseConfig.idpLogout}.
 * - `LOOPAUTH_ID_TOKEN_SIGNING_ALG`: See {@link BaseConfig.idTokenSigningAlg}.
 * - `LOOPAUTH_LEGACY_SAME_SITE_COOKIE`: See {@link BaseConfig.legacySameSiteCookie}.
 * - `LOOPAUTH_IDENTITY_CLAIM_FILTER`: See {@link BaseConfig.identityClaimFilter}.
 * - `NEXT_PUBLIC_LOOPAUTH_LOGIN`: See {@link NextConfig.routes}.
 * - `LOOPAUTH_CALLBACK`: See {@link BaseConfig.routes}.
 * - `LOOPAUTH_POST_LOGOUT_REDIRECT`: See {@link BaseConfig.routes}.
 * - `LOOPAUTH_AUDIENCE`: See {@link BaseConfig.authorizationParams}.
 * - `LOOPAUTH_SCOPE`: See {@link BaseConfig.authorizationParams}.
 * - `LOOPAUTH_ORGANIZATION`: See {@link NextConfig.organization}.
 * - `LOOPAUTH_SESSION_NAME`: See {@link SessionConfig.name}.
 * - `LOOPAUTH_SESSION_ROLLING`: See {@link SessionConfig.rolling}.
 * - `LOOPAUTH_SESSION_ROLLING_DURATION`: See {@link SessionConfig.rollingDuration}.
 * - `LOOPAUTH_SESSION_ABSOLUTE_DURATION`: See {@link SessionConfig.absoluteDuration}.
 * - `LOOPAUTH_SESSION_AUTO_SAVE`: See {@link SessionConfig.autoSave}.
 * - `LOOPAUTH_COOKIE_DOMAIN`: See {@link CookieConfig.domain}.
 * - `LOOPAUTH_COOKIE_PATH`: See {@link CookieConfig.path}.
 * - `LOOPAUTH_COOKIE_TRANSIENT`: See {@link CookieConfig.transient}.
 * - `LOOPAUTH_COOKIE_HTTP_ONLY`: See {@link CookieConfig.httpOnly}.
 * - `LOOPAUTH_COOKIE_SECURE`: See {@link CookieConfig.secure}.
 * - `LOOPAUTH_COOKIE_SAME_SITE`: See {@link CookieConfig.sameSite}.
 * - `LOOPAUTH_CLIENT_ASSERTION_SIGNING_KEY`: See {@link BaseConfig.clientAssertionSigningKey}
 * - `LOOPAUTH_CLIENT_ASSERTION_SIGNING_ALG`: See {@link BaseConfig.clientAssertionSigningAlg}
 * - `LOOPAUTH_TRANSACTION_COOKIE_NAME` See {@link BaseConfig.transactionCookie}
 * - `LOOPAUTH_TRANSACTION_COOKIE_DOMAIN` See {@link BaseConfig.transactionCookie}
 * - `LOOPAUTH_TRANSACTION_COOKIE_PATH` See {@link BaseConfig.transactionCookie}
 * - `LOOPAUTH_TRANSACTION_COOKIE_SAME_SITE` See {@link BaseConfig.transactionCookie}
 * - `LOOPAUTH_TRANSACTION_COOKIE_SECURE` See {@link BaseConfig.transactionCookie}
 *
 * ### 2. Create your own instance using {@link InitAuth}
 *
 * If you don't want to configure the SDK with environment variables or you want more fine grained control over the
 * instance, you can create an instance yourself and use the handlers and helpers from that.
 *
 * First, export your configured instance from another module:
 *
 * ```js
 * // utils/auth0.js
 * import { initAuth } from '@loopauth/nextjs';
 *
 * export default initAuth({ ...ConfigParameters... });
 * ```
 *
 * Then import it into your route handler:
 *
 * ```js
 * // pages/api/auth/[auth0].js
 * import auth0 from '../../../../utils/auth0';
 *
 * export default auth0.handleAuth();
 * ```
 *
 * **IMPORTANT** If you use {@link InitAuth}, you should *not* use the other named exports as they will use a different
 * instance of the SDK. Also note - this is for the server side part of the SDK - you will always use named exports for
 * the front end components: {@link UserProvider}, {@link UseUser} and the
 * front end version of {@link WithPageAuthRequired}
 *
 * @category Server
 */
export type ConfigParameters = DeepPartial<NextConfig>;

/**
 * @ignore
 */
const FALSEY = ['n', 'no', 'false', '0', 'off'];

/**
 * @ignore
 */
const bool = (param?: any, defaultValue?: boolean): boolean | undefined => {
  if (param === undefined || param === '') return defaultValue;
  if (param && typeof param === 'string') return !FALSEY.includes(param.toLowerCase().trim());
  return !!param;
};

/**
 * @ignore
 */
const num = (param?: string): number | undefined => (param === undefined || param === '' ? undefined : +param);

/**
 * @ignore
 */
const array = (param?: string): string[] | undefined =>
  param === undefined || param === '' ? undefined : param.replace(/\s/g, '').split(',');

/**
 * @ignore
 */
export const getConfig = (params: ConfigParameters = {}): NextConfig => {
  // Don't use destructuring here so that the `DefinePlugin` can replace any env vars specified in `next.config.js`
  const LOOPAUTH_SECRET = process.env.LOOPAUTH_SECRET;
  const LOOPAUTH_ISSUER_BASE_URL = process.env.LOOPAUTH_ISSUER_BASE_URL;
  const LOOPAUTH_BASE_URL = process.env.LOOPAUTH_BASE_URL || process.env.NEXT_PUBLIC_LOOPAUTH_BASE_URL;
  const LOOPAUTH_CLIENT_ID = process.env.LOOPAUTH_CLIENT_ID;
  const LOOPAUTH_CLIENT_SECRET = process.env.LOOPAUTH_CLIENT_SECRET;
  const LOOPAUTH_CLOCK_TOLERANCE = process.env.LOOPAUTH_CLOCK_TOLERANCE;
  const LOOPAUTH_HTTP_TIMEOUT = process.env.LOOPAUTH_HTTP_TIMEOUT;
  const LOOPAUTH_ENABLE_TELEMETRY = process.env.LOOPAUTH_ENABLE_TELEMETRY;
  const LOOPAUTH_IDP_LOGOUT = process.env.LOOPAUTH_IDP_LOGOUT;
  const LOOPAUTH_LOGOUT = process.env.LOOPAUTH_LOGOUT;
  const LOOPAUTH_ID_TOKEN_SIGNING_ALG = process.env.LOOPAUTH_ID_TOKEN_SIGNING_ALG;
  const LOOPAUTH_LEGACY_SAME_SITE_COOKIE = process.env.LOOPAUTH_LEGACY_SAME_SITE_COOKIE;
  const LOOPAUTH_IDENTITY_CLAIM_FILTER = process.env.LOOPAUTH_IDENTITY_CLAIM_FILTER;
  const LOOPAUTH_CALLBACK = process.env.LOOPAUTH_CALLBACK;
  const LOOPAUTH_POST_LOGOUT_REDIRECT = process.env.LOOPAUTH_POST_LOGOUT_REDIRECT;
  const LOOPAUTH_AUDIENCE = process.env.LOOPAUTH_AUDIENCE;
  const LOOPAUTH_SCOPE = process.env.LOOPAUTH_SCOPE;
  const LOOPAUTH_ORGANIZATION = process.env.LOOPAUTH_ORGANIZATION;
  const LOOPAUTH_SESSION_NAME = process.env.LOOPAUTH_SESSION_NAME;
  const LOOPAUTH_SESSION_ROLLING = process.env.LOOPAUTH_SESSION_ROLLING;
  const LOOPAUTH_SESSION_ROLLING_DURATION = process.env.LOOPAUTH_SESSION_ROLLING_DURATION;
  const LOOPAUTH_SESSION_ABSOLUTE_DURATION = process.env.LOOPAUTH_SESSION_ABSOLUTE_DURATION;
  const LOOPAUTH_SESSION_AUTO_SAVE = process.env.LOOPAUTH_SESSION_AUTO_SAVE;
  const LOOPAUTH_SESSION_STORE_ID_TOKEN = process.env.LOOPAUTH_SESSION_STORE_ID_TOKEN;
  const LOOPAUTH_COOKIE_DOMAIN = process.env.LOOPAUTH_COOKIE_DOMAIN;
  const LOOPAUTH_COOKIE_PATH = process.env.LOOPAUTH_COOKIE_PATH;
  const LOOPAUTH_COOKIE_TRANSIENT = process.env.LOOPAUTH_COOKIE_TRANSIENT;
  const LOOPAUTH_COOKIE_HTTP_ONLY = process.env.LOOPAUTH_COOKIE_HTTP_ONLY;
  const LOOPAUTH_COOKIE_SECURE = process.env.LOOPAUTH_COOKIE_SECURE;
  const LOOPAUTH_COOKIE_SAME_SITE = process.env.LOOPAUTH_COOKIE_SAME_SITE;
  const LOOPAUTH_CLIENT_ASSERTION_SIGNING_KEY = process.env.LOOPAUTH_CLIENT_ASSERTION_SIGNING_KEY;
  const LOOPAUTH_CLIENT_ASSERTION_SIGNING_ALG = process.env.LOOPAUTH_CLIENT_ASSERTION_SIGNING_ALG;
  const LOOPAUTH_TRANSACTION_COOKIE_NAME = process.env.LOOPAUTH_TRANSACTION_COOKIE_NAME;
  const LOOPAUTH_TRANSACTION_COOKIE_DOMAIN = process.env.LOOPAUTH_TRANSACTION_COOKIE_DOMAIN;
  const LOOPAUTH_TRANSACTION_COOKIE_PATH = process.env.LOOPAUTH_TRANSACTION_COOKIE_PATH;
  const LOOPAUTH_TRANSACTION_COOKIE_SAME_SITE = process.env.LOOPAUTH_TRANSACTION_COOKIE_SAME_SITE;
  const LOOPAUTH_TRANSACTION_COOKIE_SECURE = process.env.LOOPAUTH_TRANSACTION_COOKIE_SECURE;

  const baseURL =
    LOOPAUTH_BASE_URL && !/^https?:\/\//.test(LOOPAUTH_BASE_URL as string)
      ? `https://${LOOPAUTH_BASE_URL}`
      : LOOPAUTH_BASE_URL;

  const {organization, ...baseParams} = params;

  const baseConfig = getBaseConfig({
    secret: LOOPAUTH_SECRET,
    issuerBaseURL: LOOPAUTH_ISSUER_BASE_URL,
    baseURL: baseURL,
    clientID: LOOPAUTH_CLIENT_ID,
    clientSecret: LOOPAUTH_CLIENT_SECRET,
    clockTolerance: num(LOOPAUTH_CLOCK_TOLERANCE),
    httpTimeout: num(LOOPAUTH_HTTP_TIMEOUT),
    enableTelemetry: bool(LOOPAUTH_ENABLE_TELEMETRY),
    idpLogout: bool(LOOPAUTH_IDP_LOGOUT, true),
    auth0Logout: bool(LOOPAUTH_LOGOUT, true),
    idTokenSigningAlg: LOOPAUTH_ID_TOKEN_SIGNING_ALG,
    legacySameSiteCookie: bool(LOOPAUTH_LEGACY_SAME_SITE_COOKIE),
    identityClaimFilter: array(LOOPAUTH_IDENTITY_CLAIM_FILTER),
    ...baseParams,
    authorizationParams: {
      response_type: 'code',
      audience: LOOPAUTH_AUDIENCE,
      scope: LOOPAUTH_SCOPE,
      ...baseParams.authorizationParams,
    },
    session: {
      name: LOOPAUTH_SESSION_NAME,
      rolling: bool(LOOPAUTH_SESSION_ROLLING),
      rollingDuration:
        LOOPAUTH_SESSION_ROLLING_DURATION && isNaN(Number(LOOPAUTH_SESSION_ROLLING_DURATION))
          ? (bool(LOOPAUTH_SESSION_ROLLING_DURATION) as false)
          : num(LOOPAUTH_SESSION_ROLLING_DURATION),
      absoluteDuration:
        LOOPAUTH_SESSION_ABSOLUTE_DURATION && isNaN(Number(LOOPAUTH_SESSION_ABSOLUTE_DURATION))
          ? bool(LOOPAUTH_SESSION_ABSOLUTE_DURATION)
          : num(LOOPAUTH_SESSION_ABSOLUTE_DURATION),
      autoSave: bool(LOOPAUTH_SESSION_AUTO_SAVE, true),
      storeIDToken: bool(LOOPAUTH_SESSION_STORE_ID_TOKEN),
      ...baseParams.session,
      cookie: {
        domain: LOOPAUTH_COOKIE_DOMAIN,
        path: LOOPAUTH_COOKIE_PATH || '/',
        transient: bool(LOOPAUTH_COOKIE_TRANSIENT),
        httpOnly: bool(LOOPAUTH_COOKIE_HTTP_ONLY),
        secure: bool(LOOPAUTH_COOKIE_SECURE),
        sameSite: LOOPAUTH_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none' | undefined,
        ...baseParams.session?.cookie,
      },
    },
    routes: {
      callback: baseParams.routes?.callback || LOOPAUTH_CALLBACK || '/api/auth/callback',
      postLogoutRedirect: baseParams.routes?.postLogoutRedirect || LOOPAUTH_POST_LOGOUT_REDIRECT,
    },
    clientAssertionSigningKey: LOOPAUTH_CLIENT_ASSERTION_SIGNING_KEY,
    clientAssertionSigningAlg: LOOPAUTH_CLIENT_ASSERTION_SIGNING_ALG,
    transactionCookie: {
      name: LOOPAUTH_TRANSACTION_COOKIE_NAME,
      domain: LOOPAUTH_TRANSACTION_COOKIE_DOMAIN,
      path: LOOPAUTH_TRANSACTION_COOKIE_PATH || '/',
      secure: bool(LOOPAUTH_TRANSACTION_COOKIE_SECURE),
      sameSite: LOOPAUTH_TRANSACTION_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none' | undefined,
      ...baseParams.transactionCookie,
    },
  });

  return {
    ...baseConfig,
    organization: organization || LOOPAUTH_ORGANIZATION,
    routes: {
      ...baseConfig.routes,
      login: baseParams.routes?.login || process.env.NEXT_PUBLIC_LOOPAUTH_LOGIN || '/api/auth/login',
    },
  };
};

export type GetConfig = (req: AuthRequest | AuthRequestCookies) => Promise<NextConfig> | NextConfig;

export const configSingletonGetter = (params: ConfigParameters = {}, genId: () => string): GetConfig => {
  let config: NextConfig;
  return req => {
    if (!config) {
      // Bails out of static rendering for Server Components
      // Need to query cookies because Server Components don't have access to URL
      req.getCookies();
      if ('getUrl' in req) {
        // Bail out of static rendering for API Routes
        // Reading cookies is not always enough https://github.com/vercel/next.js/issues/49006
        req.getUrl();
      }
      config = getConfig({...params, session: {genId, ...params.session}});
    }
    return config;
  };
};
