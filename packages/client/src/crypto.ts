import {type webcrypto} from 'crypto';

export const getCrypto = (): webcrypto.Crypto => {
  return (globalThis.crypto as webcrypto.Crypto) || require('crypto').webcrypto;
};
