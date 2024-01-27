import urlJoin from 'url-join';

import {GetClient} from '../client/abstract-client';
import {Config, GetConfig, LoginOptions} from '../config';
import {AuthRequest, AuthResponse} from '../http';
import TransientStore from '../transient-store';
import createDebug from '../utils/debug';
import {encodeState} from '../utils/encoding';

const debug = createDebug('handlers');

function getRedirectUri(config: Config): string {
  return urlJoin(config.baseURL, config.routes.callback);
}

export type HandleLogin = (req: AuthRequest, res: AuthResponse, options?: LoginOptions) => Promise<void>;

export type AuthVerification = {
  nonce: string;
  state: string;
  max_age?: number;
  code_verifier?: string;
  response_type?: string;
};

export default function loginHandlerFactory(
  getConfig: GetConfig,
  getClient: GetClient,
  transientHandler: TransientStore,
): HandleLogin {
  const getConfigFn = typeof getConfig === 'function' ? getConfig : () => getConfig;
  return async (req, res, options = {}) => {
    const config = await getConfigFn(req);
    const client = await getClient(config);
    const returnTo = options.returnTo ?? config.baseURL;

    const opts = {
      returnTo,
      getLoginState: config.getLoginState,
      ...options,
    };

    // Ensure a redirect_uri, merge in configuration options, then passed-in options.
    opts.authorizationParams = {
      redirect_uri: getRedirectUri(config),
      ...config.authorizationParams,
      ...(opts.authorizationParams || {}),
    };

    const stateValue = opts.getLoginState(opts);
    if (typeof stateValue !== 'object') {
      throw new Error('Custom state value must be an object.');
    }
    stateValue.nonce = await client.generateRandomNonce();
    stateValue.returnTo ??= opts.returnTo;

    const responseType = opts.authorizationParams.response_type as string;
    const usePKCE = responseType.includes('code');
    if (usePKCE) {
      debug('response_type includes code, the authorization request will use PKCE');
      stateValue.code_verifier = await client.generateRandomCodeVerifier();
    }

    const validResponseTypes = ['id_token', 'code id_token', 'code'];
    if (!validResponseTypes.includes(responseType)) {
      throw new Error(`response_type should be one of ${validResponseTypes.join(', ')}`);
    }
    if (!/\bopenid\b/.test(opts.authorizationParams.scope as string)) {
      throw new Error('scope should contain "openid"');
    }

    const authVerification: AuthVerification = {
      nonce: await client.generateRandomNonce(),
      state: encodeState(stateValue),
    };

    if (opts.authorizationParams.max_age) {
      authVerification.max_age = opts.authorizationParams.max_age;
    }

    const authParams = {...opts.authorizationParams, ...authVerification};

    if (usePKCE) {
      authVerification.code_verifier = await client.generateRandomCodeVerifier();
      authParams.code_challenge_method = 'S256';
      authParams.code_challenge = await client.calculateCodeChallenge(authVerification.code_verifier);
    }

    if (responseType !== config.authorizationParams.response_type) {
      authVerification.response_type = responseType;
    }

    await transientHandler.save(config.transactionCookie.name, req, res, {
      sameSite: authParams.response_mode === 'form_post' ? 'none' : config.transactionCookie.sameSite,
      value: JSON.stringify(authVerification),
    });

    const authorizationUrl = await client.authorizationUrl(authParams);
    debug('redirecting to %s', authorizationUrl);

    res.redirect(authorizationUrl);
  };
}
