# NOVYA Sales Partner Dashboard

Next.js web client for Sales Partners and Sales Team Leads. It uses the NOVYA dark design reference, personal Settings and avatar-owned Account controls. Sales, Office and Media remain accessible; the Workspace menu has been removed.

## Local development

Run `npm install`, configure `.env` and start `npm run dev`. Open http://localhost:3000.

Required configuration:

- `NEXT_PUBLIC_BASE_URL`: backend API root including `/api/v1`.
- `AUTH_SECRET`: a persistent NextAuth secret.
- `AUTH_URL` / `NEXTAUTH_URL`: the web origin when required by the hosting environment.

Use the backend's authorized Sales account provisioning or invitation activation. Login requires an active canonical Sales staff membership; there is no public role-selection signup. Never commit credentials.

## Verification

- `npm test` checks the safe spreadsheet formula evaluator.
- `npx tsc --noEmit --incremental false` checks types.
- `npm run lint` checks source lint rules.
- `npm run build` creates and validates the production build.

## Implementation

The route dispatcher is `components/novya/experience.tsx`; shared layout and controls are in `shell.tsx` and `ui.tsx`. Screen families are grouped by domain in `components/novya`. The theme and responsive rules are in `app/novya.css`. `lib/sales.ts` calls protected `/sales-experience` APIs through the existing authenticated client. Learning, security, notifications and connected email reuse their existing services.

The backend contract and integration configuration are documented in `../backendKoraAi/SALES_DASHBOARD_API.md`. The workspace report at `../output/reports/sales-partner-dashboard-implementation.md` records coverage, checks and validation limits. Approved brand assets, published courses, assigned territories and external integrations are supplied by the backend; the application does not seed example production metrics.
