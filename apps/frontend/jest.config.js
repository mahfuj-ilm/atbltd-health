const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^lucide-react$': '<rootDir>/node_modules/lucide-react/dist/cjs/lucide-react.js',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/__tests__/**',
    '!app/**/layout.tsx',
    '!app/providers.tsx',
    '!app/i18n/**',
    '!app/lib/constants.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 60,
      branches: 55,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
