import {mockCache} from './cookie-cache.mock';

jest.mock('../../cookie-cache', () => ({
  CookieCache: {
    create: jest.fn((_, cookie: string) => {
      const data = JSON.parse(cookie);
      return {
        ...mockCache,
        values: jest.fn(async () => JSON.stringify(data)),
      };
    }),
  },
}));
