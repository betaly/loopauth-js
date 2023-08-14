import {urlSafeBase64} from './base64';
import {JWTVerifyOptions, User} from './types';

export interface JWTDecodeResult {
  encoded: {
    header: string;
    payload: string;
    signature: string;
  };
  header: {
    alg: string;
    typ: string;
  };
  user: User;
}

export const decode = (token: string): JWTDecodeResult => {
  const parts = token.split('.');
  const [header, payload, signature] = parts;

  if (!payload) {
    throw new Error('Invalid token');
  }

  const json = JSON.parse(urlSafeBase64.decode(payload));

  return {
    encoded: {header, payload, signature},
    header: JSON.parse(urlSafeBase64.decode(header)),
    user: json,
  };
};

export const verify = (options: JWTVerifyOptions) => {
  if (!options.token) {
    throw new Error('ID token is required but missing');
  }

  const decoded = decode(options.token);

  if (decoded.header.alg !== 'RS256' && decoded.header.alg !== 'HS256') {
    throw new Error(
      `Signature algorithm of "${decoded.header.alg}" is not supported. Expected the ID(Access) token to be signed with "RS256".`,
    );
  }

  if (!decoded.user.id) {
    throw new Error('User ID must be a string present in the token');
  }

  return decoded;
};
