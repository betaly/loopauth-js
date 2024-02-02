import nock from 'nock';
import {CookieJar} from 'tough-cookie';
import {parse} from 'url';

import logoutHandlerFactory from '../../../auth-session/handlers/logout';
import {encodeState} from '../../../auth-session/utils/encoding';
import {makeIdToken} from '../fixtures/cert';
import {defaultConfig, fromCookieJar, get, post, toSignedCookieJar} from '../fixtures/helpers';
import {SessionResponse, setup, teardown} from '../fixtures/server';
import wellKnown from '../fixtures/well-known.json';

const login = async (baseURL: string): Promise<CookieJar> => {
  const nonce = '__test_nonce__';
  const state = encodeState({returnTo: 'https://example.org'});
  const cookieJar = await toSignedCookieJar({auth_verification: JSON.stringify({state, nonce})}, baseURL);
  await post(baseURL, '/callback', {
    body: {
      state,
      id_token: await makeIdToken({nonce}),
    },
    cookieJar,
  });
  return cookieJar;
};

describe('logout route', () => {
  afterEach(teardown);

  it('should accept lazy config', () => {
    const getConfig = () => {
      throw new Error();
    };
    expect(() => (logoutHandlerFactory as any)(getConfig)).not.toThrow();
  });

  it('should perform a local logout', async () => {
    const baseURL = await setup({...defaultConfig, idpLogout: false});
    const cookieJar = await login(baseURL);

    const session: SessionResponse = await get(baseURL, '/session', {cookieJar});
    expect(session.id_token).toBeTruthy();

    const {res} = await get(baseURL, '/logout', {cookieJar, fullResponse: true});

    await expect(get(baseURL, '/session', {cookieJar})).rejects.toThrowError('Unauthorized');

    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(baseURL);
  });

  it('should delete session cookies on logout', async () => {
    const baseURL = await setup({...defaultConfig, idpLogout: false});
    const cookieJar = await login(baseURL);
    cookieJar.setCookieSync('foo=bar', baseURL);

    await get(baseURL, '/session', {cookieJar});
    expect(fromCookieJar(cookieJar, baseURL)).toMatchObject({
      appSession: expect.any(String),
      foo: 'bar',
    });

    await get(baseURL, '/logout', {cookieJar, fullResponse: true});
    const cookies = fromCookieJar(cookieJar, baseURL);
    expect(cookies).toHaveProperty('foo');
    expect(cookies).not.toHaveProperty('appSession');
  });

  it('should perform a distributed logout', async () => {
    const baseURL = await setup({...defaultConfig, auth0Logout: false, idpLogout: true});
    const cookieJar = await login(baseURL);

    const session: SessionResponse = await get(baseURL, '/session', {cookieJar});
    expect(session.id_token).toBeTruthy();

    const {res} = await get(baseURL, '/logout', {cookieJar, fullResponse: true});

    await expect(get(baseURL, '/session', {cookieJar})).rejects.toThrowError('Unauthorized');

    expect(res.statusCode).toEqual(302);
    const redirect = parse(res.headers.location, true);
    expect(redirect).toMatchObject({
      hostname: 'op.example.com',
      pathname: '/session/end',
      protocol: 'https:',
      query: {
        post_logout_redirect_uri: baseURL,
        id_token_hint: session.id_token,
      },
    });
  });

  it('should perform an auth0 logout', async () => {
    const baseURL = await setup({
      ...defaultConfig,
      issuerBaseURL: 'https://test.eu.auth0.com/',
      idpLogout: true,
      auth0Logout: true,
    });
    const nonce = '__test_nonce__';
    const state = encodeState({returnTo: 'https://example.org'});
    const cookieJar = await toSignedCookieJar({auth_verification: JSON.stringify({state, nonce})}, baseURL);
    await post(baseURL, '/callback', {
      body: {
        state,
        id_token: await makeIdToken({nonce, iss: 'https://test.eu.auth0.com/'}),
      },
      cookieJar,
    });

    const session: SessionResponse = await get(baseURL, '/session', {cookieJar});
    expect(session.id_token).toBeTruthy();

    const {res} = await get(baseURL, '/logout', {cookieJar, fullResponse: true});

    await expect(get(baseURL, '/session', {cookieJar})).rejects.toThrowError('Unauthorized');

    expect(res.statusCode).toEqual(302);
    const redirect = parse(res.headers.location, true);
    expect(redirect).toMatchObject({
      hostname: 'test.eu.auth0.com',
      pathname: '/v2/logout',
      protocol: 'https:',
      query: expect.objectContaining({
        client_id: '__test_client_id__',
        returnTo: baseURL,
      }),
    });
  });

  it('should redirect to postLogoutRedirect', async () => {
    const postLogoutRedirect = 'https://example.com/post-logout';
    const baseURL = await setup({...defaultConfig, routes: {...defaultConfig.routes, postLogoutRedirect}});
    const cookieJar = await login(baseURL);

    const session: SessionResponse = await get(baseURL, '/session', {cookieJar});
    expect(session.id_token).toBeTruthy();

    const {res} = await get(baseURL, '/logout', {cookieJar, fullResponse: true});

    await expect(get(baseURL, '/session', {cookieJar})).rejects.toThrowError('Unauthorized');

    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(postLogoutRedirect);
  });

  it('should redirect to the specified returnTo', async () => {
    const returnTo = 'https://example.com/return-to';
    const baseURL = await setup(defaultConfig, {logoutOptions: {returnTo}});
    const cookieJar = await login(baseURL);

    const session: SessionResponse = await get(baseURL, '/session', {cookieJar});
    expect(session.id_token).toBeTruthy();

    const {res} = await get(baseURL, '/logout', {cookieJar, fullResponse: true});

    await expect(get(baseURL, '/session', {cookieJar})).rejects.toThrowError('Unauthorized');

    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(returnTo);
  });

  it('should redirect when already logged out', async () => {
    const returnTo = 'https://example.com/return-to';
    const baseURL = await setup(defaultConfig, {logoutOptions: {returnTo}});

    const {res} = await get(baseURL, '/logout', {fullResponse: true});

    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toEqual(returnTo);
  });

  it('should clear session cookie when SameSite=None', async () => {
    const baseURL = await setup(
      {...defaultConfig, idpLogout: false, session: {cookie: {sameSite: 'none'}}},
      {https: true},
    );
    const cookieJar = await login(baseURL);
    cookieJar.setCookieSync('foo=bar', baseURL);

    await get(baseURL, '/session', {cookieJar});
    expect(fromCookieJar(cookieJar, baseURL)).toMatchObject({
      appSession: expect.any(String),
      foo: 'bar',
    });

    const {res} = await get(baseURL, '/logout', {cookieJar, fullResponse: true});
    const cookies = fromCookieJar(cookieJar, baseURL);
    const sessionCookie = res.headers['set-cookie'].find((s: string) => /^appSession/.test(s));
    expect(sessionCookie).toMatch(/Secure/);
    expect(sessionCookie).toMatch(/SameSite=None/);
    expect(cookies).toHaveProperty('foo');
    expect(cookies).not.toHaveProperty('appSession');
  });

  it('should pass logout params to idp', async () => {
    const baseURL = await setup({...defaultConfig, idpLogout: true}, {logoutOptions: {logoutParams: {foo: 'bar'}}});
    const cookieJar = await login(baseURL);

    const session: SessionResponse = await get(baseURL, '/session', {cookieJar});
    expect(session.id_token).toBeTruthy();

    const {res} = await get(baseURL, '/logout', {cookieJar, fullResponse: true});

    await expect(get(baseURL, '/session', {cookieJar})).rejects.toThrowError('Unauthorized');

    expect(res.statusCode).toEqual(302);
    const redirect = parse(res.headers.location, true);
    expect(redirect).toMatchObject({
      hostname: 'op.example.com',
      pathname: '/session/end',
      protocol: 'https:',
      query: {
        post_logout_redirect_uri: baseURL,
        id_token_hint: session.id_token,
        foo: 'bar',
      },
    });
  });

  it('should pass logout params to auth0', async () => {
    const baseURL = await setup(
      {...defaultConfig, issuerBaseURL: 'https://op.auth0.com', idpLogout: true, auth0Logout: true},
      {logoutOptions: {logoutParams: {foo: 'bar'}}},
    );
    const {end_session_endpoint, ...a0WellKnown} = wellKnown;
    nock('https://op.auth0.com').get('/.well-known/openid-configuration').reply(200, a0WellKnown);
    const cookieJar = await login(baseURL);

    const session: SessionResponse = await get(baseURL, '/session', {cookieJar});
    expect(session.id_token).toBeTruthy();

    const {res} = await get(baseURL, '/logout', {cookieJar, fullResponse: true});

    await expect(get(baseURL, '/session', {cookieJar})).rejects.toThrowError('Unauthorized');

    expect(res.statusCode).toEqual(302);
    const redirect = parse(res.headers.location, true);
    expect(redirect).toMatchObject({
      hostname: 'op.example.com',
      pathname: '/v2/logout',
      protocol: 'https:',
      query: {
        client_id: defaultConfig.clientID,
        foo: 'bar',
      },
    });
  });

  it('should ignore null logout params', async () => {
    const baseURL = await setup(
      {...defaultConfig, issuerBaseURL: 'https://op.auth0.com', idpLogout: true, auth0Logout: true},
      {logoutOptions: {logoutParams: {foo: 'bar', baz: null, qux: undefined, federated: ''}}},
    );
    const {end_session_endpoint, ...a0WellKnown} = wellKnown;
    nock('https://op.auth0.com').get('/.well-known/openid-configuration').reply(200, a0WellKnown);
    const cookieJar = await login(baseURL);

    const session: SessionResponse = await get(baseURL, '/session', {cookieJar});
    expect(session.id_token).toBeTruthy();

    const {res} = await get(baseURL, '/logout', {cookieJar, fullResponse: true});

    await expect(get(baseURL, '/session', {cookieJar})).rejects.toThrowError('Unauthorized');

    expect(res.statusCode).toEqual(302);
    const redirect = parse(res.headers.location, true);
    expect(redirect).toMatchObject({
      hostname: 'op.example.com',
      pathname: '/v2/logout',
      protocol: 'https:',
      query: {
        client_id: defaultConfig.clientID,
        foo: 'bar',
        federated: '',
      },
    });
    expect(redirect.query).not.toHaveProperty('baz');
    expect(redirect.query).not.toHaveProperty('qux');
  });
});