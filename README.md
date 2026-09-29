# FluenceOS Lead Leak Audit

Standalone FluenceOS acquisition application for `audit.fluenceos.io`.

## Architecture decision

This application is intentionally separate from Pipeline OS application code and deployment. It may use the same FluenceOS Vercel account and Supabase project, but it must remain isolated through its own Vercel project, environment variables, codebase, and dedicated Audit table.

## Current checkpoint

Implemented in this scaffold:

- standalone Next.js 16 application shell
- locked 8-question configuration
- TypeScript Audit types
- deterministic scoring / diagnosis engine
- operational-impact, tie-break, coherence, and approved causal-chain logic
- 13 scoring tests based on the agreed stress-test profiles
- deterministic visitor-facing result-content configuration
- dynamic copy selection for Missing Next Actions, Follow-Up, and Scattered Leads
- 9 result-content tests covering variants, terminology, and CTA rules
- server-only Supabase client
- validated `POST /api/lead-leak-audit` submission route
- dedicated `lead_leak_audit_responses` migration with RLS and no public table policies
- anonymous attribution/device/completion metadata storage
- 5 submission-validation tests
- visitor-facing intro screen
- one-question-at-a-time responsive Audit flow
- progress indicator, back navigation, and final submission state
- result experience with diagnosis, why-it-matters, practical actions, related finding, Pipeline OS bridge, and free-forever CTA
- UTM/referrer capture from the browser at submission
- best-effort Supabase CTA click tracking without delaying navigation
- optional GA4 events for Audit start, completion, result view, retake, and Pipeline OS CTA click

Not implemented yet:

- Vercel project or DNS configuration

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and add the standalone Audit Supabase values.
3. Apply `supabase/migrations/20260929_create_lead_leak_audit_responses.sql` to the FluenceOS Supabase project.
4. Run `npm test`.
5. Run `npm run dev`.

Do not copy Pipeline OS secrets into this project. Add only the environment variables this standalone Audit actually requires.

## Data boundary

The browser never writes directly to Supabase. Completed Audit answers are posted to the standalone Next.js route, scored server-side, then stored using a server-only service-role key. RLS is enabled and no `anon` or `authenticated` policy is created for the Audit table. No name, email, or raw user-agent is stored.


## Analytics events

If `NEXT_PUBLIC_GA_MEASUREMENT_ID` is configured, the standalone Audit emits:

- `audit_started`
- `audit_completed`
- `audit_result_viewed`
- `audit_retake`
- `pipeline_os_cta_clicked`

CTA clicks are also recorded on the completed response row through `POST /api/lead-leak-audit/cta`. The request uses browser `keepalive` and never blocks navigation to Pipeline OS if tracking fails.

## Deployment checkpoint

The codebase is ready for its own Vercel project. It requires only the standalone Audit environment variables in `.env.example`. The Supabase migration is included for the intended FluenceOS Supabase project. See `docs/DEPLOYMENT.md` for production setup and smoke-testing steps.
Deployment trigger
