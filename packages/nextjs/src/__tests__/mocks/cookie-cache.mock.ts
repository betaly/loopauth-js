import {PickProperties} from 'ts-essentials';

import type {CookieCache} from '../../cookie-cache';

export const mockCache: PickProperties<CookieCache, Function> = {
  allKeys: jest.fn(),
  clear: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
  save: jest.fn(),
  set: jest.fn((key, value) => console.log(key, value)),
  values: jest.fn(),
};
