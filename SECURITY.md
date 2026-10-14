# Security Policy

## Reporting a Vulnerability

Please report suspected vulnerabilities privately by emailing the repository
owner at the contact address listed on the GitHub profile. Do not open a
public issue for sensitive findings.

Include:

- Affected feature or endpoint
- Steps to reproduce
- Impact summary
- Any relevant logs, screenshots, or proof of concept details

We aim to acknowledge reports within 72 hours and provide a remediation plan
after triage.

## Supported Versions

Security fixes are applied to the active `main` branch. Tagged releases should
be upgraded to the latest available version.

## Automated Security Audits & Hygiene

This repository enforces automated security checks across its development lifecycle:

- **Static Application Security Testing (SAST):** GitHub CodeQL analyzes JavaScript and TypeScript codebases on every push and pull request to detect CWE vulnerabilities, injection patterns, and logic flaws (`.github/workflows/codeql.yml`).
- **Secret Scanning:** Automated secret scanning is enforced in CI using Gitleaks to prevent credential and API key exposure (`.github/workflows/ci.yml`).
- **Dependency Vulnerability Auditing:** Continuous auditing of production dependencies via `npm audit --omit=dev --audit-level=high` in CI pipelines and Dependabot security updates (`.github/dependabot.yml`).
- **Input Validation:** Request boundaries are sanitized using `class-validator` and `class-transformer` with strict whitelisting to eliminate parameter tampering.
