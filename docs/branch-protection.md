# Branch Protection & Review Policy

This repository treats `main` as a protected branch. The following
rules are configured on GitHub under
**Settings → Branches → Branch protection rules → main**.

## Required rules

| Rule                                                             | Value                                                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Require a pull request before merging                            | ✅ enabled                                                                                                                |
| Require approvals                                                | 1                                                                                                                         |
| Dismiss stale pull request approvals when new commits are pushed | ✅ enabled                                                                                                                |
| Require review from Code Owners                                  | ✅ enabled (`CODEOWNERS`)                                                                                                 |
| Require status checks to pass before merging                     | ✅ enabled                                                                                                                |
| Required status checks                                           | `Lint`, `Typecheck`, `Build`, `Unit Tests with Coverage`, `Backend E2E Tests`, `Dependency Security Audit`, `Secret Scan` |
| Require branches to be up to date before merging                 | ✅ enabled                                                                                                                |
| Require conversation resolution before merging                   | ✅ enabled                                                                                                                |
| Require linear history                                           | ✅ enabled                                                                                                                |
| Do not allow bypassing the above settings                        | ✅ enabled                                                                                                                |

## CI workflow mapping

Each required status check above corresponds to a job in
`.github/workflows/ci.yml`:

- `Lint` → `jobs.lint`
- `Typecheck` → `jobs.typecheck`
- `Build` → `jobs.build`
- `Unit Tests with Coverage` → `jobs.test`
- `Backend E2E Tests` → `jobs.test-e2e`
- `Dependency Security Audit` → `jobs.audit`
- `Secret Scan` → `jobs.secret-scan`

## Local verification

Before opening a PR, contributors should run:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:cov
npm run build
```
