# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0] — 2026-10-16

### Added

- Super Admin Staff Settings & Management:
  - Dedicated staff settings page (`/admin/settings`) restricted solely to Super Admin.
  - Staff credential reset and secure temporary password generation.
  - Account status toggling (activation/deactivation) with self-deactivation protection.
  - Admin creation endpoint (`POST /api/admin/staff/admins`) with sequential `ATB-{YY}-AD-{N}` ID scheme and validation.
- Test Coverage & Quality Gates:
  - Expanded test suite to 70 suites / 480 tests across backend and frontend.
  - Enforced automated numeric coverage gate in CI (`scripts/check-coverage.mjs`).
- Brand & Localization:
  - Standardized brand spelling to "Sushtho Thaki BD Ltd." across docs and i18n bundles.
  - Updated Chairman career positions in English and Bengali.

## [0.3.0] — 2026-09-05

### Reliability and Security

- Added an initial TypeORM migration and disposable-database migration check in
  CI.
- Disabled production schema synchronization and automatic migrations until the
  existing EC2 schema is baselined.
- Gated EC2 deployments on successful completion of the full CI workflow.
- Added post-deployment backend and frontend health checks with container log
  output on failure.
- Raised npm audit enforcement to high-severity findings and added retries for
  transient npm registry failures.
- Made payment authorization atomic and idempotent.

### Test Coverage

- Added authorization-boundary E2E coverage for member and admin routes.
- Added migration execution validation against an empty PostgreSQL database.
- Formatted the generated initial migration to pass repository lint checks.

### Initial Release Features

- Structured logging with nestjs-pino
- Sequential Maker-Checker approval workflow across all features
- Auto-generated passwords for owners/agents (name prefix + mobile suffix)
- SMS notifications for owner/agent approval
- Health endpoint (`GET /api/health`)
- About Chairman section on landing page
- Owners management page with expandable sub-agents
- Created By tracking for owners and agents
- Password visibility toggle on staff login

### Changed

- Member ID format: `ATB-26-ME-01`
- Staff ID formats: `ATB-26-SA-1`, `ATB-26-AD-1`, `ATB-26-OW-1`, `ATB-26-AG-1`
- Split large components into modular files (under 500 LOC)
- Replaced bcrypt with bcryptjs for Docker compatibility
- Official accounts moved to environment variables
- Seed passwords moved to environment variables

### Tests

- AuthService: 14 tests
- ClaimService: 9 tests
- AdminService: 9 tests
- AgentService: 10 tests
- ClaimDocumentService: 8 tests
- AgentApprovalService: 9 tests
- MembershipModal (Frontend): 5 tests

### Security

- Remove hardcoded temporary password
- Environment-based payment account routing
- npm audit in CI pipeline
- Role-based access control for all admin routes

### Documentation

- Comprehensive README.md
- .env.example files for backend and frontend
- Documented `SENTRY_DSN` and `SMS_DISABLED` in the root environment example.
- CONTRIBUTING.md
- CHANGELOG.md

## [0.1.0] — 2026-08-15

### Added

- Initial release of ATB Ltd healthcare fintech platform
- Membership registration with bKash payment verification
- Claim/benefit application system with document upload
- Agent-owner commission engine with multi-level approvals
- Hospital partner portal for claim verification
- Real-time notification system (dashboard bell + SMS)
- 5-tier role-based access control
- Maker-Checker dual approval for financial operations
- Fraud detection (NID/mobile/transaction duplicate checks)
- Audit logging for all system actions
- CI/CD pipeline with GitHub Actions → Docker → AWS EC2
