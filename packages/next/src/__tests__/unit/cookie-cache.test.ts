import * as crypto from 'crypto';

import {pack, unpack} from '../../cookie-cache';

const secret = 'secret';

export const ID_TOKEN = 'idToken';

describe('CookieCache', () => {
  describe('pack/unpack', () => {
    it('should be able to pack', async () => {
      const cookie = await pack({[ID_TOKEN]: 'idToken'}, secret, crypto as Crypto);
      expect(cookie).toContain('.');
    });

    it('should be able to unpack', async () => {
      const session = await unpack(
        'BShU2NGKg5762PWEOFu8lhzXKZMktgjH1RR4ifik4aGOOerM7w==.DFFnnlzSnjRbTl7I',
        secret,
        crypto as Crypto,
      );
      expect(session[ID_TOKEN]).toEqual('idToken');
    });

    it('should be able to pack and unpack', async () => {
      const cookie = await pack({[ID_TOKEN]: 'idToken'}, secret, crypto as Crypto);
      const session = await unpack(cookie, secret, crypto as Crypto);
      expect(session[ID_TOKEN]).toEqual('idToken');
    });
  });
});
