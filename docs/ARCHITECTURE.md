# Lead Leak Audit Architecture

## Decision status

**DECIDED / SUPERSEDES EARLIER SAME-PROJECT APPROACH**

The Lead Leak Audit is a standalone FluenceOS application, not part of the Pipeline OS codebase.

It is intended to use:

- the same FluenceOS Vercel account,
- a separate Vercel project,
- `audit.fluenceos.io`,
- the same Supabase account/project if desired,
- a dedicated Audit-only table,
- separate environment variables,
- separate deployment and rollback behavior.

Pipeline OS files, routes, authentication, build configuration, and deployment remain untouched.

## Boundary

The Audit may share brand language and infrastructure accounts with FluenceOS. It should not import application code from Pipeline OS or rely on Pipeline OS routes/auth/session state.

## Current implementation order

1. Locked question configuration.
2. Deterministic scoring engine.
3. Automated scoring tests.
4. Result-content configuration.
5. Interactive UI.
6. Dedicated Supabase table and server submission endpoint.
7. Analytics / CTA tracking.
8. Vercel project + `audit.fluenceos.io` DNS.
