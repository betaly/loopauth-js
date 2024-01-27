import {IncomingMessage, ServerResponse} from 'http';
import {NextApiRequest, NextApiResponse} from 'next';
import {NextRequest, NextResponse} from 'next/server';

import type {TokenEndpointResponse} from '../auth-session';
import {AbstractSession, SessionCache as ISessionCache, StatefulSession, StatelessSession} from '../auth-session';
import {AuthRequest, AuthResponse, NodeRequest, NodeResponse} from '../auth-session/http';
import {GetConfig, NextConfig} from '../config';
import {
  AuthNextApiRequest,
  AuthNextApiResponse,
  AuthNextRequest,
  AuthNextRequestCookies,
  AuthNextResponse,
  AuthNextResponseCookies,
} from '../http';
import {isNextApiRequest, isRequest} from '../utils/req-helpers';
import Session, {fromJson, fromTokenEndpointResponse} from './session';

type Req = IncomingMessage | NextRequest | NextApiRequest;
type Res = ServerResponse | NextResponse | NextApiResponse;

export const getAuthReqRes = (req: Req, res: Res): [AuthRequest, AuthResponse] => {
  if (isRequest(req)) {
    return [new AuthNextRequest(req as NextRequest), new AuthNextResponse(res as NextResponse)];
  }
  if (isNextApiRequest(req)) {
    return [new AuthNextApiRequest(req as NextApiRequest), new AuthNextApiResponse(res as NextApiResponse)];
  }
  return [new NodeRequest(req as IncomingMessage), new NodeResponse(res as ServerResponse)];
};

export default class SessionCache implements ISessionCache<Req, Res, Session> {
  private cache: WeakMap<Req, Session | null | undefined>;
  private iatCache: WeakMap<Req, number | undefined>;
  private sessionStore?: AbstractSession<Session>;

  constructor(public getConfig: GetConfig) {
    this.cache = new WeakMap();
    this.iatCache = new WeakMap();
  }

  public getSessionStore(config: NextConfig): AbstractSession<Session> {
    if (!this.sessionStore) {
      this.sessionStore = config.session.store
        ? new StatefulSession<Session>(config)
        : new StatelessSession<Session>(config);
    }
    return this.sessionStore;
  }

  async save(req: Req, res: Res): Promise<void> {
    const [authReq, authRes] = getAuthReqRes(req, res);
    const config = await this.getConfig(authReq);
    const sessionStore = this.getSessionStore(config);
    await sessionStore.save(authReq, authRes, this.cache.get(req), this.iatCache.get(req));
  }

  async create(req: Req, res: Res, session: Session): Promise<void> {
    this.cache.set(req, session);
    await this.save(req, res);
  }

  async delete(req: Req, res: Res): Promise<void> {
    await this.init(req, res, false);
    this.cache.set(req, null);
    await this.save(req, res);
  }

  async isAuthenticated(req: Req, res: Res): Promise<boolean> {
    await this.init(req, res);
    const session = this.cache.get(req);
    return !!session?.user;
  }

  async getIdToken(req: Req, res: Res): Promise<string | undefined> {
    await this.init(req, res);
    const session = this.cache.get(req);
    return session?.idToken;
  }

  async set(req: Req, res: Res, session: Session | null | undefined): Promise<void> {
    await this.init(req, res, false);
    this.cache.set(req, session);
    await this.save(req, res);
  }

  async get(req: Req, res: Res): Promise<Session | null | undefined> {
    await this.init(req, res);
    return this.cache.get(req);
  }

  async fromTokenEndpointResponse(req: Req, res: Res, tokenSet: TokenEndpointResponse): Promise<Session> {
    const [authReq] = getAuthReqRes(req, res);
    const config = await this.getConfig(authReq);
    return fromTokenEndpointResponse(tokenSet, config);
  }

  private async init(req: Req, res: Res, autoSave = true): Promise<void> {
    if (!this.cache.has(req)) {
      const [authReq] = getAuthReqRes(req, res);
      const config = await this.getConfig(authReq);
      const sessionStore = this.getSessionStore(config);
      const [json, iat] = await sessionStore.read(authReq);
      this.iatCache.set(req, iat);
      this.cache.set(req, fromJson(json));
      if (config.session.rolling && config.session.autoSave && autoSave) {
        await this.save(req, res);
      }
    }
  }
}

export const get = async ({
  sessionCache,
  req,
  res,
}: {
  sessionCache: SessionCache;
  req?: Req;
  res?: Res;
}): Promise<[(Session | null)?, number?]> => {
  if (req && res) {
    return [await sessionCache.get(req, res)];
  }
  const authReq = new AuthNextRequestCookies();
  const config = await sessionCache.getConfig(authReq);
  const sessionStore = sessionCache.getSessionStore(config);
  const {
    session: {rolling, autoSave},
  } = config;
  const [json, iat] = await sessionStore.read(authReq);
  const session = fromJson(json);
  if (rolling && autoSave) {
    await set({session, sessionCache, iat});
  }
  return [session, iat];
};

export const set = async ({
  session,
  sessionCache,
  iat,
  req,
  res,
}: {
  session?: Session | null;
  sessionCache: SessionCache;
  iat?: number;
  req?: Req;
  res?: Res;
}): Promise<void> => {
  if (req && res) {
    return sessionCache.set(req, res, session);
  }
  const authReq = new AuthNextRequestCookies();
  const config = await sessionCache.getConfig(authReq);
  const sessionStore = sessionCache.getSessionStore(config);
  await sessionStore.save(authReq, new AuthNextResponseCookies(), session, iat);
};
