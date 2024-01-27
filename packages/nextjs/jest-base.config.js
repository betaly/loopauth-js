/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: ['**/?(*.)+(spec|test|unit|integration|acceptance).ts?(x)'],
  testPathIgnorePatterns: ['node_modules', 'dist'],
  preset: 'ts-jest/presets/js-with-ts',
  setupFilesAfterEnv: ['./src/__tests__/setup.ts'],
  // transformIgnorePatterns: ['<rootDir>/node_modules/(?!oauth4webapi)'],
};
