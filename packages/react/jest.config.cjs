const pkg = require('./package.json');

module.exports = {
  clearMocks: true,
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest'],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: ['**/?(*.)+(spec|test|unit|integration|acceptance).[jt]s?(x)'],
  testPathIgnorePatterns: ['node_modules', 'dist'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'https://www.example.com/',
  },
  globals: {
    __VERSION__: pkg.version,
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results/jest' }],
  ],
  coveragePathIgnorePatterns: ['/__tests__/', 'index.tsx'],
  coverageReporters: ['html', 'text', 'text-summary', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
