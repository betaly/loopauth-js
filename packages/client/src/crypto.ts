import {type webcrypto} from 'crypto';

export const getCrypto = (): webcrypto.Crypto => {
  return require('node:crypto').webcrypto;
};
