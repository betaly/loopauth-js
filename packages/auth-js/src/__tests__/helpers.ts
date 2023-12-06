import {expect} from '@jest/globals';
import UrlSafer from 'urlsafer';

export const expectToHaveBeenCalledWithAuthClientParam = (mock: any, expected: any) => {
  const [[url]] = (<jest.Mock>mock).mock.calls;
  const param = new URL(url).searchParams.get('authClient');
  const decodedParam = decodeURIComponent(UrlSafer.decode(param as string));
  const actual = JSON.parse(decodedParam);
  expect(actual).toStrictEqual(expected);
};

export const expectToHaveBeenCalledWithHash = (mock: any, expected: any) => {
  const [[url]] = (<jest.Mock>mock).mock.calls;
  const hash = new URL(url).hash;
  expect(hash).toEqual(expected);
};
