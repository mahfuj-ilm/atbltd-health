#!/usr/bin/env node
/**
 * Numeric coverage gate for CI.
 *
 * Reads each workspace's Jest coverage summary (coverage/coverage-summary.json,
 * produced by the "json-summary" reporter) and compares every metric against
 * the coverageThreshold.global values declared in that workspace's
 * jest.config.js. Prints a table and exits non-zero if any metric falls below
 * its threshold or if a summary file is missing.
 *
 * Usage (after `npm run test:cov`):
 *   node scripts/check-coverage.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const WORKSPACES = ['apps/backend', 'apps/frontend'];
const METRICS = ['statements', 'branches', 'functions', 'lines'];

async function loadThresholds(workspaceDir) {
  const exported = require(path.join(workspaceDir, 'jest.config.js'));
  // next/jest wraps the config in an async factory; plain configs are objects.
  const config = typeof exported === 'function' ? await exported() : exported;
  const global = config?.coverageThreshold?.global;
  if (!global) {
    throw new Error(`No coverageThreshold.global defined in ${workspaceDir}/jest.config.js`);
  }
  return global;
}

function loadSummary(workspaceDir) {
  const summaryPath = path.join(workspaceDir, 'coverage', 'coverage-summary.json');
  if (!existsSync(summaryPath)) {
    throw new Error(`Missing ${path.relative(repoRoot, summaryPath)}; run "npm run test:cov" first`);
  }
  return JSON.parse(readFileSync(summaryPath, 'utf8')).total;
}

async function main() {
  let failed = false;

  for (const workspace of WORKSPACES) {
    const workspaceDir = path.join(repoRoot, workspace);
    const thresholds = await loadThresholds(workspaceDir);
    const totals = loadSummary(workspaceDir);

    console.log(`\n${workspace}`);
    for (const metric of METRICS) {
      const minimum = thresholds[metric];
      if (typeof minimum !== 'number') continue;
      const actual = totals[metric].pct;
      const ok = actual >= minimum;
      if (!ok) failed = true;
      console.log(
        `  ${ok ? 'PASS' : 'FAIL'}  ${metric.padEnd(10)} ${actual.toFixed(2).padStart(6)}%  (minimum ${minimum}%)`,
      );
    }
  }

  if (failed) {
    console.error('\nCoverage gate failed: at least one metric is below its threshold.');
    process.exit(1);
  }
  console.log('\nCoverage gate passed: all metrics meet their thresholds.');
}

main().catch((error) => {
  console.error(`Coverage gate error: ${error.message}`);
  process.exit(1);
});
