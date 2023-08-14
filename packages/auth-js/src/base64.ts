/**
 * RFC 4648 section 5: base64url (URL- and filename-safe standard)
 * @link https://datatracker.ietf.org/doc/html/rfc4648#section-5
 */
/**
 * RFC 4648 section 5: base64url (URL- and filename-safe standard)
 * @link https://datatracker.ietf.org/doc/html/rfc4648#section-5
 */
const replaceNonUrlSafeCharacters = (base64String: string) =>
  base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const restoreNonUrlSafeCharacters = (base64String: string) => base64String.replace(/-/g, '+').replace(/_/g, '/');

export const urlSafeBase64 = {
  isSafe: (input: string) => /^[\w-]*$/.test(input),
  encode: (rawString: string) => {
    const encodedString =
      typeof window === 'undefined'
        ? Buffer.from(rawString, 'utf8').toString('base64')
        : window.btoa(unescape(encodeURIComponent(rawString)));

    return replaceNonUrlSafeCharacters(encodedString);
  },
  decode: (encodedString: string) => {
    const nonUrlSafeEncodedString = restoreNonUrlSafeCharacters(encodedString);

    return typeof window === 'undefined'
      ? Buffer.from(nonUrlSafeEncodedString, 'base64').toString('utf8')
      : decodeURIComponent(escape(window.atob(nonUrlSafeEncodedString)));
  },
  replaceNonUrlSafeCharacters,
  restoreNonUrlSafeCharacters,
};
