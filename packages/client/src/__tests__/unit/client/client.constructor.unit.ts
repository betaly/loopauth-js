import {ICache} from '../../../cache';
import * as utils from '../../../utils';
import {TEST_CLIENT_CHALLENGE} from '../../constants';
import {loginWithRedirectFn, prepareClientMocks} from './helpers';

// jest.mock('es-cookie');
jest.mock('../../../tokens');

const mockCache: ICache = {
  set: jest.fn().mockResolvedValue(null),
  get: jest.fn().mockResolvedValue(null),
  remove: jest.fn().mockResolvedValue(null),
};

jest.spyOn(utils, 'stringToBase64UrlEncoded').mockReturnValue(TEST_CLIENT_CHALLENGE);

// jest.spyOn(utils, 'runPopup');

describe('AuthClient', () => {
  const {setup, mockWindow, mockFetch} = prepareClientMocks();

  describe('constructor', () => {
    it('should create issuer from domain', () => {
      const client = setup({
        domain: 'test.dev',
      });

      expect((<any>client).tokenIssuer).toEqual('https://test.dev/');
    });

    it('should allow issuer as a domain', () => {
      const client = setup({
        issuer: 'foo.bar.com',
      });

      expect((<any>client).tokenIssuer).toEqual('https://foo.bar.com/');
    });

    it('should allow issuer as a fully qualified url', () => {
      const client = setup({
        issuer: 'https://some.issuer.com/',
      });

      expect((<any>client).tokenIssuer).toEqual('https://some.issuer.com/');
    });

    it('should allow specifying domain with http scheme', () => {
      const client = setup({
        domain: 'http://localhost',
      });

      expect((<any>client).domainUrl).toEqual('http://localhost');
    });

    it('should allow specifying domain with https scheme', () => {
      const client = setup({
        domain: 'https://localhost',
      });

      expect((<any>client).domainUrl).toEqual('https://localhost');
    });

    it('uses a custom cache if one was given in the configuration', async () => {
      const client = setup({
        cache: mockCache,
      });

      await loginWithRedirectFn(mockWindow, mockFetch)(client);

      expect(mockCache.set).toHaveBeenCalled();
    });
  });
});
