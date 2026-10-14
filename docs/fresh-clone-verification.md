# Repository fresh-checkout verification

Verified on 2026-10-13 from a tracked-files-only archive of commit
`bee4b18ea748166c2ad1c37670fb82fd32748e89`. The archive had no local `.env`,
`.env.local`, or `.env.production` files.

Environment: Node.js `v26.8.1`, npm `11.19.0`.

| Command | Result |
| --- | --- |
| `npm ci` | Passed; installed from the committed root lockfile. |
| `npm run build` | Passed; backend and frontend production builds completed. |
| `npm run test:cov` | Passed; backend 27 suites / 250 tests (86% line coverage), frontend 38 suites / 155 tests (77% line coverage, meeting the 70% threshold). |
| `npm run typecheck` | Passed for backend and frontend. |
| `npm run test:isolated` | Passed; backend 27 suites / 250 tests (zero network socket binding). |
| `npm run lint` | Passed with 0 errors across both workspaces (backend 22 warnings, frontend 0 errors/warnings on ESLint 9 Flat Config). |
| `npm audit --workspaces --omit=dev --audit-level=high` | Passed; 0 production dependency vulnerabilities. |

The full workspace audit (`npm audit --workspaces --audit-level=high`) reports
5 high, 1 critical, and 20 moderate vulnerabilities in the dependency tree;
the production-only audit above is clean. Review development-tool advisories
before upgrades, since npm reports that some suggested fixes require breaking
dependency changes.

Backend e2e tests were not run: Docker is not installed in the verification
environment. In CI, the `backend-e2e-test` job starts the disposable database
with `docker compose -f docker-compose.test.yml up -d --wait` before running
`npm run test:e2e:backend`.
