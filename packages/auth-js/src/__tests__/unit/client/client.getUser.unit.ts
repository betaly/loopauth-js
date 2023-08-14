import {expect} from '@jest/globals';

import {ICache} from '../../..';
import * as utils from '../../../utils';
import {TEST_CLIENT_CHALLENGE} from '../../constants';
import {prepareClientMocks} from './helpers';

jest.mock('../../../tokens');

jest.spyOn(utils, 'stringToBase64UrlEncoded').mockReturnValue(TEST_CLIENT_CHALLENGE);

describe('AuthClient', () => {
  const {setup} = prepareClientMocks();

  describe('getUser', () => {
    it('returns undefined if there is no user in the cache', async () => {
      const client = setup();
      const decodedToken = await client.getUser();

      expect(decodedToken).toBeUndefined();
    });

    it('searches the user in the cache', async () => {
      const cache: ICache = {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn(),
      };
      const client = setup({cache});
      await client.getUser();

      expect(cache.get).toBeCalledWith('@@loopauth@@::auth_client_id::@@user@@');
    });

    it('fallback to searching the user stored with the access token', async () => {
      const getMock = jest.fn();
      const cache: ICache = {
        get: getMock,
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn(),
      };

      getMock.mockImplementation((key: string) => {
        if (key === '@@loopauth@@::auth_client_id') {
          return {
            body: {idToken: 'abc', decodedToken: {user: {id: '123'}}},
          };
        }
      });

      const client = setup({cache});
      const user = await client.getUser();

      expect(cache.get).toBeCalledWith('@@loopauth@@::auth_client_id::@@user@@');
      expect(cache.get).toBeCalledWith('@@loopauth@@::auth_client_id');
      expect(user?.id).toBe('123');
    });

    it('does not fallback to searching the user stored with the access token when user found', async () => {
      const getMock = jest.fn();
      const cache: ICache = {
        get: getMock,
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn(),
      };

      getMock.mockImplementation((key: string) => {
        if (key === '@@loopauth@@::auth_client_id::@@user@@') {
          return {idToken: 'abc', decodedToken: {user: {id: '123'}}};
        }
      });

      const client = setup({cache});
      const user = await client.getUser();

      expect(cache.get).toBeCalledWith('@@loopauth@@::auth_client_id::@@user@@');
      expect(cache.get).not.toBeCalledWith('@@loopauth@@::auth_client_id::default::openid profile email');
      expect(user?.id).toBe('123');
    });

    it('should return from the in memory cache if no changes', async () => {
      const getMock = jest.fn();
      const cache: ICache = {
        get: getMock,
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn(),
      };

      getMock.mockImplementation((key: string) => {
        if (key === '@@loopauth@@::auth_client_id::@@user@@') {
          return {idToken: 'abcd', decodedToken: {user: {id: '123'}}};
        }
      });

      const client = setup({cache});
      const user = await client.getUser();
      const secondUser = await client.getUser();

      expect(user).toBe(secondUser);
    });

    it('should return a new object from the cache when the user object changes', async () => {
      const getMock = jest.fn();
      const cache: ICache = {
        get: getMock,
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn(),
      };

      getMock.mockImplementation((key: string) => {
        if (key === '@@loopauth@@::auth_client_id::@@user@@') {
          return {idToken: 'abcd', decodedToken: {user: {id: '123'}}};
        }
      });

      const client = setup({cache});
      const user = await client.getUser();
      const secondUser = await client.getUser();

      expect(user).toBe(secondUser);

      getMock.mockImplementation((key: string) => {
        if (key === '@@loopauth@@::auth_client_id::@@user@@') {
          return {
            idToken: 'abcdefg',
            decodedToken: {user: {id: '123'}},
          };
        }
      });

      const thirdUser = await client.getUser();
      expect(thirdUser).not.toBe(user);
    });

    it('should return undefined if there is no cache entry', async () => {
      const cache: ICache = {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        allKeys: jest.fn(),
      };

      const client = setup({cache});
      await expect(client.getUser()).resolves.toBe(undefined);
    });
  });
});
