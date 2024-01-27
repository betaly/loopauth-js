import {NextRequest, NextResponse} from 'next/server';
import nock from 'nock';
import nodeFetch from 'node-fetch';

import {
  AuthServer,
  CallbackOptions,
  Claims,
  ConfigParameters,
  initAuth as nodeInitAuth,
  LoginOptions,
  LogoutOptions,
  ProfileOptions,
} from '../../..';
import {StatelessSession} from '../../auth-session';
import {encodeState} from '../../auth-session/utils/encoding';
import {getConfig} from '../../config';
import {initAuth as edgeInitAuth} from '../../edge';
import {AuthNextRequest} from '../../http';
import {signCookie} from '../auth-session/fixtures/helpers';
import {withApi} from './default-settings';
import {setupNock} from './setup';

const isEdgeRuntime =
  // @ts-ignore
  typeof EdgeRuntime !== 'undefined';

export const initAuth = (config: ConfigParameters) => {
  if (isEdgeRuntime) {
    return edgeInitAuth(config);
  }
  return nodeInitAuth(config);
};

export const mockFetch = () => {
  if (isEdgeRuntime) {
    jest.spyOn(globalThis, 'fetch').mockImplementation((...args: any[]) =>
      (nodeFetch as any)(...args).then(async (res: any) => {
        const res2 = new Response(await res.text(), {
          headers: Object.fromEntries(res.headers.entries()),
          status: res.status,
        });
        Object.defineProperty(res2, 'url', {value: args[0]});
        return res2;
      }),
    );
  }
};

export type GetResponseOpts = {
  url: string;
  config?: ConfigParameters;
  cookies?: {[key: string]: string};
  idTokenClaims?: Claims;
  discoveryOptions?: Record<string, string>;
  userInfoPayload?: Record<string, string>;
  userInfoToken?: string;
  callbackOpts?: CallbackOptions;
  loginOpts?: LoginOptions;
  logoutOpts?: LogoutOptions;
  profileOpts?: ProfileOptions;
  extraHandlers?: any;
  clearNock?: boolean;
  auth0Instance?: AuthServer;
  reqInit?: RequestInit;
  parStatus?: number;
  parPayload?: Record<string, unknown>;
};

export type LoginOpts = Omit<GetResponseOpts, 'url'>;

export const getResponse = async ({
  url,
  config,
  cookies,
  idTokenClaims,
  discoveryOptions,
  userInfoPayload,
  userInfoToken,
  callbackOpts,
  loginOpts,
  logoutOpts,
  profileOpts,
  extraHandlers,
  clearNock = true,
  auth0Instance,
  reqInit,
  parStatus,
  parPayload,
}: GetResponseOpts) => {
  const opts = {...withApi, ...config};
  clearNock && nock.cleanAll();
  await setupNock(opts, {idTokenClaims, discoveryOptions, userInfoPayload, userInfoToken, parPayload, parStatus});
  const auth0 = url.split('?')[0].split('/').slice(3);
  const instance = auth0Instance ?? initAuth(opts);
  const handleAuth = instance.handleAuth({
    ...(callbackOpts && {callback: instance.handleCallback(callbackOpts)}),
    ...(loginOpts && {login: instance.handleLogin(loginOpts)}),
    ...(logoutOpts && {logout: instance.handleLogout(logoutOpts)}),
    ...(profileOpts && {profile: instance.handleProfile(profileOpts)}),
    onError(_req: any, error: any) {
      return new Response(null, {status: error.status ?? 500, statusText: error.message});
    },
    ...extraHandlers,
  });
  const headers = new Headers();
  if (cookies) {
    headers.set(
      'Cookie',
      Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; '),
    );
  }
  return handleAuth(new NextRequest(new URL(url, opts.baseURL), {headers, ...reqInit} as any), {params: {auth0}});
};

export const getSession = async (config: any, res: NextResponse) => {
  const req = new NextRequest('https://example.com');
  res.cookies.getAll().forEach(({name, value}: {name: string; value: string}) => value && req.cookies.set(name, value));

  const store = new StatelessSession(getConfig(config));
  const [session] = await store.read(new AuthNextRequest(req));
  return session;
};

export const login = async (opts: LoginOpts = {}) => {
  const state = encodeState({returnTo: '/'});
  return getResponse({
    ...opts,
    url: `/api/auth/callback?state=${state}&code=code`,
    cookies: {
      ...opts.cookies,
      auth_verification: await signCookie(
        'auth_verification',
        JSON.stringify({state, nonce: '__test_nonce__', code_verifier: '__test_code_verifier__'}),
      ),
    },
  });
};
