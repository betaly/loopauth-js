import {NextClientOptions} from '@loopauth/next';

export const AUTH_OPTIONS: NextClientOptions = {
  clientId: process.env.NEXT_APP_CLIENT_ID ?? '<client-id>',
  clientSecret: process.env.NEXT_APP_CLIENT_SECRET ?? '<client-secret>',
  domain: process.env.NEXT_APP_DOMAIN ?? 'http://localhost:3001',
  baseUrl: process.env.NEXT_APP_BASE_URL ?? 'http://localhost:3000',
  cookieSecret: process.env.NEXT_APP_COOKIE_SECRET ?? 'complex_password_at_least_32_characters_long',
  cookieSecure: process.env.NODE_ENV === 'production',
};
