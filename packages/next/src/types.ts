import {AuthClientOptions} from '@loopauth/client';

export interface NextClientOptions extends AuthClientOptions {
  cookieSecret: string;
  cookieSecure: boolean;
  baseUrl: string;
  cookieChunkSize?: number;
}

export interface NextAppState {
  redirectUri?: string;
}
