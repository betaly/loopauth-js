import {mockCache} from './cookie-cache.mock';

jest.mock('../../cookie-cache', () => ({
  CookieCache: {
    create: jest.fn(() => mockCache),
  },
}));
