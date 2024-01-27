import AuthResponseCookies from './auth-response-cookies';

export default abstract class AuthResponse<Res = any> extends AuthResponseCookies {
  protected constructor(public res: Res) {
    super();
  }

  public abstract redirect(location: string, status?: number): void;

  public abstract send204(): void;

  public abstract setHeader(name: string, value: string): void;
}
