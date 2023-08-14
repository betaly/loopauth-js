import {urlSafeBase64} from './base64';
import {DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS} from './constants';
import {AuthenticationResult} from './types';

export const runIframe = (
  authorizeUrl: string,
  eventOrigin: string,
  timeoutInSeconds: number = DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
): Promise<any> => {
  throw new Error('Not implemented');
};

const stripUndefined = (params: any) => {
  return Object.keys(params)
    .filter(k => typeof params[k] !== 'undefined')
    .reduce((acc, key) => ({...acc, [key]: params[key]}), {});
};

export const createQueryParams = ({clientId: client_id, ...params}: any) => {
  return new URLSearchParams(stripUndefined({client_id, ...params})).toString();
};

export const createFormParams = (params: any) => {
  return new URLSearchParams(stripUndefined(params)).toString();
};

/**
 * @ignore
 */
export const getDomain = (domainUrl: string) => {
  if (!/^https?:\/\//.test(domainUrl)) {
    return `https://${domainUrl}`;
  }

  return domainUrl;
};

/**
 * @ignore
 */
export const getTokenIssuer = (issuer: string | undefined, domainUrl: string) => {
  if (issuer) {
    return issuer.startsWith('https://') ? issuer : `https://${issuer}/`;
  }

  return `${domainUrl}/`;
};

export const parseNumber = (value: any): number | undefined => {
  if (typeof value !== 'string') {
    return value;
  }
  return parseInt(value, 10) || undefined;
};

export const parseAuthenticationResult = (queryString: string): AuthenticationResult => {
  if (queryString.indexOf('#') > -1) {
    queryString = queryString.substring(0, queryString.indexOf('#'));
  }

  const searchParams = new URLSearchParams(queryString);

  return {
    // state: searchParams.get('state')!,
    code: searchParams.get('code') || undefined,
    error: searchParams.get('error') || undefined,
    error_description: searchParams.get('error_description') || undefined,
  };
};

const urlEncodeB64 = (input: string) => {
  const b64Chars: {[index: string]: string} = {'+': '-', '/': '_', '=': ''};
  return input.replace(/[+/=]/g, (m: string) => b64Chars[m]);
};

// https://stackoverflow.com/questions/30106476/
const decodeB64 = (input: string) =>
  decodeURIComponent(
    atob(input)
      .split('')
      .map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(''),
  );

export const urlDecodeB64 = (input: string) => decodeB64(input.replace(/_/g, '/').replace(/-/g, '+'));

export const stringToBase64UrlEncoded = (input: string) => {
  return urlEncodeB64(urlSafeBase64.encode(input));
};
