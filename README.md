# Fantasy F1 Picks

Private MVP web app for F1 prediction picks, lock-based reveal, scoring, and standings.

See [docs/mvp-checklist.md](/home/dhinojos/Projects/fantasyf1/docs/mvp-checklist.md) for the implementation plan and staging.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + RLS + SQL functions
- Recharts
- Vitest

## Features

- Email/password login for a private user list
- Approved-email enforcement in the database trigger on `auth.users`
- Server-side lock enforcement through Supabase RLS using `now()`
- Admin race creation with active-driver selection
- Picks entry for sprint 1st, sprint 2nd, pole, and finishing positions 1-10
- Visibility lock: own picks before deadline, all picks after deadline
- Admin result entry with automatic score recalculation
- Standings, last-race points, countdown, insights, and accuracy chart
- Responsive dark motorsport-inspired UI

## Project Structure

```text
src/
  app/                router
  components/         layout, dashboard, picks, results, admin UI
  context/            auth provider
  hooks/              auth hook
  lib/                domain rules, formatting, constants
  pages/              screen-level routes
  services/supabase/  client, auth, data access, row mappers
  types/              shared domain types
supabase/
  schema.sql          tables, policies, triggers, scoring function
docs/
  mvp-checklist.md    short implementation plan
```

## Routes

- `/login`
- `/`
- `/submit`
- `/picks`
- `/results`
- `/admin` (admin only)

## Supabase Setup

1. Create a Supabase project.
2. In the SQL editor, run [supabase/schema.sql](/home/dhinojos/Projects/fantasyf1/supabase/schema.sql).
3. In Supabase Auth, keep email/password enabled.
4. Insert approved emails into `public.allowed_emails`.
5. Create Auth users for each approved email and assign the same shared password to each user.
6. Use one of those approved users as the admin by setting `is_admin = true` in `allowed_emails` before creating that auth user.

The database trigger rejects users whose email is not in `allowed_emails`, so access is not enforced only by the frontend.

## Environment Variables

Create `.env.local`:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deployment

The app is a standard Vite SPA and can be deployed to Vercel, Netlify, or Supabase hosting.

1. Add the two `VITE_SUPABASE_*` environment variables in your host.
2. Run the Supabase schema in the target project.
3. Build with `npm run build`.
4. Deploy the generated `dist/` output.

## Scoring

- Driver picked anywhere in the race top 10 and actually finishing in the race top 10: `1`
- Correct sprint 2nd: `1`
- Correct pole: `2`
- Correct sprint 1st: `2`
- Correct race P3: `3`
- Correct race P2: `4`
- Correct race P1: `5`

Results can be edited by an admin. Publishing corrected results reruns the SQL recalculation function and updates per-race plus cumulative scores.

## Tests Included

- Lock deadline behavior
- Duplicate driver prevention
- Scoring logic
- Visibility rules after lock

## MVP Tradeoffs

- Shared password is implemented by giving each approved user the same Supabase Auth password, instead of building a custom auth service.
- Driver data is seeded locally and in SQL instead of pulled from a live F1 API.
- Dashboard insights are computed client-side for simplicity.
- Admin workflows are intentionally compact rather than heavily permission-segmented.

## Version 2 Ideas

- Driver labels everywhere instead of raw IDs in result/pick tables via richer joined queries
- Season filtering and historical race drill-down
- Better standings movement based on previous round instead of simple visual indicator
- Bulk allowlist management UI
- Automated race import from a trusted F1 schedule source
