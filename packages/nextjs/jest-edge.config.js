const base = require('./jest-base.config');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: 'edge',
  testEnvironment: '@edge-runtime/jest-environment',
  testMatch: [
    '**/__tests__/handlers/login.test.ts',
    '**/__tests__/handlers/logout.test.ts',
    '**/__tests__/handlers/callback.test.ts',
    '**/__tests__/handlers/profile.test.ts',
    '**/__tests__/handlers/backchannel-logout.test.ts',
    '**/__tests__/http/auth-next-request.test.ts',
    '**/__tests__/http/auth-next-response.test.ts',
    '**/__tests__/helpers/with-middleware-auth-required.test.ts',
    '**/__tests__/session/get-access-token.test.ts',
  ],
};
