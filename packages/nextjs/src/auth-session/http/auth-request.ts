import AuthRequestCookies from './auth-request-cookies';

export default abstract class AuthRequest<Req = any> extends AuthRequestCookies {
  protected constructor(public req: Req) {
    super();
  }

  public abstract getUrl(): string;
  public abstract getMethod(): string;
  public abstract getBody(): Promise<Record<string, string> | string> | Record<string, string> | string;
}
