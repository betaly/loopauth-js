import {AuthClientOptions} from '@loopauth/auth-js';

export interface NextClientOptions extends AuthClientOptions {
  cookieSecret: string;
  cookieSecure: boolean;
  baseUrl: string;
}
