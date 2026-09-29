# Standalone Lead Leak Audit deployment

Target production URL: `https://audit.fluenceos.io`

This app is intentionally isolated from Pipeline OS. Deploy it as a separate Vercel project even though it uses the same FluenceOS Vercel account and Supabase project.

## Required Vercel environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PIPELINE_OS_URL=https://app.fluenceos.io`

Optional:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — GA4 web stream for Audit funnel events.

Never expose `SUPABASE_SERVICE_ROLE_KEY` as a `NEXT_PUBLIC_*` variable.

## Supabase

The production migration is in:

`supabase/migrations/20260929_create_lead_leak_audit_responses.sql`

The table is deliberately RLS-enabled with no anon/authenticated policies. All writes happen through server-side route handlers using the service-role key.

## Vercel

1. Create a new Vercel project for this standalone repository.
2. Add the required environment variables to Production, Preview, and Development as appropriate.
3. Deploy and smoke-test the generated Vercel URL.
4. Add `audit.fluenceos.io` as the custom domain.
5. Apply the DNS record Vercel requests at the current DNS provider.
6. Verify HTTPS and both desktop/mobile flows.

Do not attach `audit.fluenceos.io` to the Pipeline OS Vercel project.

## Smoke test

- Intro loads with no authentication redirect.
- All eight questions advance/back correctly.
- Submission returns a result.
- A new row appears in `public.lead_leak_audit_responses`.
- Result content matches the scored diagnosis.
- Pipeline OS CTA opens `https://app.fluenceos.io`.
- CTA click changes `cta_clicked` to true for that response.
- No Pipeline OS product tables are written to by the Audit.
- If GA4 is configured, start/completion/result/CTA events appear in DebugView/Realtime.
