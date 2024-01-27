import {AuthRequestCookies} from '../auth-session/http';

export default class AuthNextRequestCookies extends AuthRequestCookies {
  public constructor() {
    super();
  }

  public getCookies(): Record<string, string> {
    const {cookies} = require('next/headers');
    const cookieStore = cookies();
    return cookieStore.getAll().reduce(
      (memo: Record<string, string>, {name, value}: {name: string; value: string}) => ({
        ...memo,
        [name]: value,
      }),
      {},
    );
  }
}
