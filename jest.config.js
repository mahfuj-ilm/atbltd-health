/**
 * Root Jest configuration for the monorepo.
 *
 * Runs the backend (NestJS, ts-jest, node) and frontend (Next.js, jsdom)
 * suites as Jest projects, so `npx jest` or `npm test` from the repository
 * root executes every unit test in one invocation. Each project keeps its
 * own jest.config.js; per-workspace coverage thresholds are enforced by
 * `npm run test:cov` and checked numerically by scripts/check-coverage.mjs.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  projects: ['<rootDir>/apps/backend', '<rootDir>/apps/frontend'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
