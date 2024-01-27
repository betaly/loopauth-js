export default abstract class AuthRequestCookies {
  public abstract getCookies(): Record<string, string>;
}
